import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearAllLocalData } from '@/lib/clearLocalData';
import { secureAuthStorage } from '@/lib/secureStorage';

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'client' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    companyName: string,
    contactPhone?: string,
    street1?: string,
    street2?: string,
    city?: string,
    state?: string,
    zip?: string
  ) => Promise<{ error: any; userStatus?: 'new' | 'unverified' | 'verified' }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  resendVerification: (email: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Initialize from secure storage if available
  const getInitialAuthData = () => {
    const storedData = secureAuthStorage.getAuthData();
    return {
      user: storedData?.user || null,
      session: storedData?.session || null,
      profile: storedData?.profile || null,
    };
  };

  const initialData = getInitialAuthData();
  const [user, setUser] = useState<User | null>(initialData.user);
  const [session, setSession] = useState<Session | null>(initialData.session);
  const [profile, setProfile] = useState<UserProfile | null>(
    initialData.profile
  );
  const [loading, setLoading] = useState(!secureAuthStorage.hasValidAuthData());

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch user profile after setting session
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        // Clear secure storage when user logs out
        secureAuthStorage.clearAuthData();
      }
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      // Check if user is inactive
      if (data && !data.is_active) {
        console.log('User is inactive, signing out...');
        // Sign out the user
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
        window.location.href = '/auth?message=account_deactivated';
        return;
      }

      setProfile(data);

      // Client record is now created automatically by the handle_new_user trigger
      // No need to create it here anymore
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  // Client records are now created automatically by the handle_new_user trigger
  // This eliminates race conditions and simplifies the signup flow

  // Persist auth data to secure storage whenever state changes
  useEffect(() => {
    if (user && session && profile) {
      secureAuthStorage.setAuthData(user, session, profile);
    }
  }, [user, session, profile]);

  const signUp = async (
    email: string,
    password: string,
    companyName: string,
    contactPhone?: string,
    street1?: string,
    street2?: string,
    city?: string,
    state?: string,
    zip?: string
  ) => {
    // Use environment variable for production, fallback to current origin for development
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectUrl = `${baseUrl}/auth/callback`;

    try {
      // First, try to sign up normally
      // Include company information in user metadata so the trigger can create the client record
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            company_name: companyName,
            contact_phone: contactPhone || null,
            street1: street1 || null,
            street2: street2 || null,
            city: city || null,
            state: state || null,
            zip: zip || null,
          },
        },
      });
      // If signup succeeds, check if user is verified
      if (!error && data.user) {
        // Check if user is already verified (existing user case)
        if (Object.keys(data.user.user_metadata).length === 0) {
          return {
            error: {
              message:
                'User already registered and verified. Please sign in instead.',
              status: 422,
            },
            userStatus: 'verified' as const,
          };
        }

        // Client record will be created automatically by the handle_new_user trigger
        return { error: null, userStatus: 'new' as const };
      }

      // Handle different error scenarios
      if (error) {
        // Check if user already exists
        if (
          error.message.includes('User already registered') ||
          error.message.includes('already been registered') ||
          error.message.includes('duplicate key value') ||
          error.message.includes('already exists') ||
          error.message.includes('email address is already in use') ||
          error.status === 422
        ) {
          // Try to sign in to check if user is verified
          const { error: signInError } = await supabase.auth.signInWithPassword(
            {
              email,
              password: 'dummy-password-to-check-status',
            }
          );

          if (signInError) {
            if (signInError.message.includes('Email not confirmed')) {
              // User exists but not verified - resend verification
              const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                  emailRedirectTo: redirectUrl,
                },
              });

              if (resendError) {
                return {
                  error: {
                    message:
                      'Failed to resend verification email. Please try again.',
                    status: 500,
                  },
                  userStatus: 'unverified' as const,
                };
              }

              return {
                error: null,
                userStatus: 'unverified' as const,
              };
            } else if (
              signInError.message.includes('Invalid login credentials')
            ) {
              // User exists and is verified (wrong password means user exists)
              return {
                error: {
                  message:
                    'User already registered and verified. Please sign in instead.',
                  status: 422,
                },
                userStatus: 'verified' as const,
              };
            }
          }

          // If we can't determine status, assume unverified and try to resend
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
              emailRedirectTo: redirectUrl,
            },
          });

          if (resendError) {
            return {
              error: {
                message:
                  'Failed to resend verification email. Please try again.',
                status: 500,
              },
              userStatus: 'unverified' as const,
            };
          }

          return {
            error: null,
            userStatus: 'unverified' as const,
          };
        }

        // Other errors
        return { error, userStatus: 'new' as const };
      }

      return { error: null, userStatus: 'new' as const };
    } catch (error) {
      console.error('Error in signUp:', error);
      return {
        error: {
          message: 'An unexpected error occurred during signup.',
          status: 500,
        },
        userStatus: 'new' as const,
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If login successful, check if user is active
    if (!error && data.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error checking user status:', profileError);
        return { error: profileError };
      }

      // Check if user is inactive
      if (profileData && !profileData.is_active) {
        // Sign out the user
        await supabase.auth.signOut();

        return {
          error: {
            message:
              'Your account has been deactivated. Please contact support for assistance.',
            name: 'AccountDeactivatedError',
            status: 403,
          } as any,
        };
      }
    }

    return { error };
  };

  const resendVerification = async (email: string) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const redirectUrl = `${baseUrl}/auth/callback`;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const rawBase = import.meta.env.VITE_APP_URL || window.location.origin;
    const baseUrl = rawBase.replace(/\/$/, '');
    const redirectUrl = `${baseUrl}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
      },
    });
    return { error };
  };

  const signInWithApple = async () => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Clear all local storage data using utility function
      await clearAllLocalData();

      // Clear secure storage
      secureAuthStorage.clearAuthData();

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Reset all state
      setUser(null);
      setSession(null);
      setProfile(null);

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, clear local data and redirect
      try {
        await clearAllLocalData();
        secureAuthStorage.clearAuthData();
      } catch (clearError) {
        console.error(
          'Error clearing local data during error handling:',
          clearError
        );
        // Fallback to basic clearing
        localStorage.clear();
        sessionStorage.clear();
      }
      setUser(null);
      setSession(null);
      setProfile(null);
      window.location.href = '/';
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    resendVerification,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
