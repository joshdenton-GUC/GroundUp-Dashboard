import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

export function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    try {
      // Check if we have a valid session from the invite link
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        toast({
          title: 'Invalid Invitation',
          description:
            'This invitation link is invalid or has expired. Please contact support.',
          variant: 'destructive',
        });
        setTokenValid(false);
        setValidatingToken(false);
        return;
      }

      // Check if user has already set a password
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email_confirmed_at && user?.user_metadata?.password_set) {
        // User already set password, redirect to dashboard
        toast({
          title: 'Already Set Up',
          description:
            'You have already set up your password. Redirecting to dashboard...',
        });
        navigate('/dashboard');
        return;
      }

      setTokenValid(true);
    } catch (error) {
      console.error('Error validating token:', error);
      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  useEffect(() => {
    // Validate password strength
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const isPasswordValid = Object.values(passwordValidation).every(v => v);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast({
        title: 'Weak Password',
        description: 'Please meet all password requirements',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please make sure both passwords are the same',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: {
          password_set: true,
        },
      });

      if (updateError) throw updateError;

      toast({
        title: 'Password Set Successfully',
        description: 'Your account is now ready. Redirecting to dashboard...',
        duration: 3000,
      });

      // Wait a moment for the toast to show
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Error setting password:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to set password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                Validating your invitation...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              Invalid Invitation
            </CardTitle>
            <CardDescription className="text-center">
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Please contact your administrator for a new invitation.
            </p>
            <Button
              onClick={() => navigate('/auth')}
              className="w-full"
              variant="outline"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Set Your Password
          </CardTitle>
          <CardDescription className="text-center">
            Welcome to Ground Up Careers! Please create a secure password for
            your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2 text-sm">
              <p className="font-medium text-muted-foreground">
                Password must contain:
              </p>
              <div className="space-y-1">
                <PasswordRequirement
                  met={passwordValidation.minLength}
                  text="At least 8 characters"
                />
                <PasswordRequirement
                  met={passwordValidation.hasUpperCase}
                  text="One uppercase letter"
                />
                <PasswordRequirement
                  met={passwordValidation.hasLowerCase}
                  text="One lowercase letter"
                />
                <PasswordRequirement
                  met={passwordValidation.hasNumber}
                  text="One number"
                />
                <PasswordRequirement
                  met={passwordValidation.hasSpecialChar}
                  text="One special character (!@#$%^&*...)"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && (
                <p
                  className={`text-sm flex items-center gap-1 ${
                    passwordsMatch ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Passwords do not match
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isPasswordValid || !passwordsMatch}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Password...
                </>
              ) : (
                'Set Password & Continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

function PasswordRequirement({ met, text }: PasswordRequirementProps) {
  return (
    <div
      className={`flex items-center gap-2 ${
        met ? 'text-green-600' : 'text-muted-foreground'
      }`}
    >
      {met ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      <span>{text}</span>
    </div>
  );
}
