import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import logoImage from '@/assets/ground-up-careers-logo.png';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img
              src={logoImage}
              alt="Ground Up Careers"
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-white">Client Portal</CardTitle>
          <CardDescription className="text-zinc-400">
            Access your hiring dashboard to manage job postings and applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full bg-orange hover:bg-orange/90"
            onClick={() => navigate('/auth')}
          >
            Sign In / Sign Up
          </Button>
          {user && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Access Dashboard
            </Button>
          )}
          <p className="text-center text-zinc-500 text-sm">
            Powered by groundupcareers.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
