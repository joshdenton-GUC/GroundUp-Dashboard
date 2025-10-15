import { User, Session } from '@supabase/supabase-js';
import secureStorage from 'react-secure-storage';

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'client' | 'user';
  created_at: string;
  updated_at: string;
}

interface StoredAuthData {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  timestamp: number;
}

const STORAGE_KEY = 'auth_data';

export const secureAuthStorage = {
  // Store auth data
  setAuthData: (
    user: User | null,
    session: Session | null,
    profile: UserProfile | null
  ) => {
    try {
      const authData: StoredAuthData = {
        user,
        session,
        profile,
        timestamp: Date.now(), // Keep timestamp for debugging/logging purposes
      };
      secureStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  },

  // Get auth data
  getAuthData: (): StoredAuthData | null => {
    try {
      const stored = secureStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const authData: StoredAuthData = JSON.parse(stored as string);
      return authData;
    } catch (error) {
      console.error('Error retrieving auth data:', error);
      secureAuthStorage.clearAuthData();
      return null;
    }
  },

  // Clear auth data
  clearAuthData: () => {
    try {
      secureStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  // Check if we have valid stored data
  hasValidAuthData: (): boolean => {
    const authData = secureAuthStorage.getAuthData();
    return (
      authData !== null && authData.user !== null && authData.profile !== null
    );
  },
};
