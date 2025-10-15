import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/ground-up-careers-logo.png';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let active = true;
    const establishRecoverySession = async () => {
      try {
        // Supabase sends recovery links to redirect URL with hash fragment containing tokens and type=recovery
        if (location.hash && location.hash.includes('type=recovery')) {
          const params = new URLSearchParams(location.hash.replace(/^#/, ''));
          const accessToken = params.get('access_token') || '';
          const refreshToken = params.get('refresh_token') || '';
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
          }
        }
        // If we already have a session at this point, proceed
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        if (!data.session) {
          throw new Error('No active recovery session found');
        }
        setSessionReady(true);
      } catch (err: any) {
        toast({
          title: 'Invalid or expired link',
          description:
            'Your password reset link is invalid or has expired. Please request a new one.',
          variant: 'destructive',
        });
        navigate('/auth');
      }
    };
    establishRecoverySession();
    return () => {
      active = false;
    };
  }, [location.hash, navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          title: 'Password reset failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password updated successfully',
          description:
            'Your password has been reset. You can now sign in with your new password.',
        });

        // Clear the form
        setPassword('');
        setConfirmPassword('');

        // Redirect to auth page after a short delay
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          'An unexpected error occurred while resetting your password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady) {
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
            <CardTitle>Validating Link…</CardTitle>
            <CardDescription>
              One moment while we verify your reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full text-center text-sm text-muted-foreground">
              If this takes too long, request a new reset link.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-orange hover:bg-orange/90"
              disabled={loading}
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="text-sm"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
