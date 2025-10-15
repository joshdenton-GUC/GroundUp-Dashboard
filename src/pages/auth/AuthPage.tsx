import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import logoImage from '@/assets/ground-up-careers-logo.png';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [street1, setStreet1] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [activeTab, setActiveTab] = useState('signin');
  const [searchParams] = useSearchParams();
  const {
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    resendVerification,
    resetPassword,
    profile,
  } = useAuth();
  const navigate = useNavigate();

  // Check for account deactivation message from URL
  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'account_deactivated') {
      toast({
        title: 'Account Deactivated',
        description:
          'Your account has been deactivated by an administrator. Please contact support for assistance.',
        variant: 'destructive',
        duration: 10000,
      });
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (profile) {
      if (profile.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/post-new-job');
      }
    }
  }, [profile, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error, userStatus } = await signUp(
        email,
        password,
        companyName,
        contactPhone,
        street1,
        street2,
        city,
        state,
        zip
      );

      if (error) {
        // Handle different user status scenarios
        if (userStatus === 'verified') {
          // User already exists and is verified
          toast({
            title: 'Account already exists',
            description:
              'This email is already registered and verified. Please sign in instead.',
            variant: 'destructive',
          });
        } else if (userStatus === 'unverified') {
          // User exists but not verified - show verification message
          setVerificationEmail(email);
          setShowVerificationMessage(true);
          toast({
            title: 'Account already exists',
            description:
              "This email is already registered but not verified. We've sent a new verification link.",
            variant: 'destructive',
          });
        } else {
          // Other errors
          toast({
            title: 'Sign up failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        // Success scenarios
        if (userStatus === 'unverified') {
          // User exists but was unverified - verification email resent
          setVerificationEmail(email);
          setShowVerificationMessage(true);
          toast({
            title: 'Verification email sent',
            description:
              "We've sent a new verification link to your email. Please check your inbox and spam folder.",
          });
        } else {
          // New user - first time signup
          toast({
            title: 'Check your email',
            description:
              'We sent you a confirmation link to complete your registration. Please check your inbox and spam folder.',
          });
          setEmail('');
          setPassword('');
          setCompanyName('');
          setContactPhone('');
          setStreet1('');
          setStreet2('');
          setCity('');
          setState('');
          setZip('');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setVerificationEmail(email);
          setShowVerificationMessage(true);
          toast({
            title: 'Email not verified',
            description:
              "Please verify your email before signing in. We'll send you a new verification link.",
            variant: 'destructive',
          });
        } else if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Invalid credentials',
            description: 'Please check your email and password.',
            variant: 'destructive',
          });
        } else if (error.message.includes('deactivated')) {
          toast({
            title: 'Account Deactivated',
            description: error.message,
            variant: 'destructive',
            duration: 10000,
          });
        } else {
          toast({
            title: 'Sign in failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: 'Google sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred with Google sign in.',
        variant: 'destructive',
      });
    } finally {
      setSocialLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setSocialLoading(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        toast({
          title: 'Apple sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred with Apple sign in.',
        variant: 'destructive',
      });
    } finally {
      setSocialLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;

    setLoading(true);
    try {
      const { error } = await resendVerification(verificationEmail);

      if (error) {
        toast({
          title: 'Failed to resend verification',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Verification email sent',
          description:
            'Please check your inbox and spam folder for the verification link.',
        });
        setShowVerificationMessage(false);
        setVerificationEmail('');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) return;

    setLoading(true);
    try {
      const { error } = await resetPassword(forgotPasswordEmail);

      if (error) {
        // Handle specific error cases
        if (
          error.message.includes('User not found') ||
          error.message.includes('Invalid email') ||
          error.message.includes('User does not exist') ||
          error.message.includes('No user found')
        ) {
          toast({
            title: 'Email not found',
            description:
              'This email address is not registered with us. Please check your email or create a new account.',
            variant: 'destructive',
          });
          // Switch to signup tab to help user create account
          setTimeout(() => {
            setActiveTab('signup');
            setEmail(forgotPasswordEmail); // Pre-fill the email
          }, 2000);
        } else if (
          error.message.includes('rate limit') ||
          error.message.includes('too many requests')
        ) {
          toast({
            title: 'Too many requests',
            description:
              'Please wait a few minutes before requesting another reset email.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Failed to send reset email',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Reset email sent',
          description:
            'Please check your inbox and spam folder for the password reset link.',
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img
              src={logoImage}
              alt="Ground Up Careers"
              className="h-16 w-auto"
            />
          </div>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Social Login Options */}
          {/* <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={socialLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {socialLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleAppleSignIn}
              disabled={socialLoading}
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              {socialLoading ? 'Signing in...' : 'Continue with Apple'}
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div> */}

          {showVerificationMessage && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Email verification required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Your account exists but needs to be verified. We'll send a
                      new verification link to{' '}
                      <strong>{verificationEmail}</strong>.
                    </p>
                  </div>
                  <div className="mt-3">
                    <div className="-mx-2 -my-1.5 flex">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={loading}
                        className="bg-yellow-50 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                      >
                        {loading ? 'Sending...' : 'Send verification email'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowVerificationMessage(false);
                          setVerificationEmail('');
                        }}
                        className="ml-2 text-yellow-800 hover:bg-yellow-100"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showForgotPassword && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    Reset your password
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Enter your email address and we'll send you a link to
                      reset your password.
                    </p>
                    <p className="mt-1 text-xs text-blue-600">
                      Note: You must use the same email address you used to
                      create your account.
                    </p>
                  </div>
                  <div className="mt-3 space-y-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={forgotPasswordEmail}
                      onChange={e => setForgotPasswordEmail(e.target.value)}
                      className="w-full"
                    />
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleForgotPassword}
                        disabled={loading || !forgotPasswordEmail}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {loading ? 'Sending...' : 'Send reset link'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordEmail('');
                        }}
                        className="border-blue-300 text-blue-800 hover:bg-blue-100"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange hover:bg-orange/90"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-muted-foreground"
                  >
                    Forgot your password?
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name *</Label>
                  <Input
                    id="company-name"
                    type="text"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street1">Street Address 1</Label>
                  <Input
                    id="street1"
                    type="text"
                    placeholder="123 Main Street"
                    value={street1}
                    onChange={e => setStreet1(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street2">Street Address 2</Label>
                  <Input
                    id="street2"
                    type="text"
                    placeholder="Suite 100 (optional)"
                    value={street2}
                    onChange={e => setStreet2(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="State"
                      value={state}
                      onChange={e => setState(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    type="text"
                    placeholder="12345"
                    value={zip}
                    onChange={e => setZip(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange hover:bg-orange/90"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
