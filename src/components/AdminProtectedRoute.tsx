import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile?.role !== 'admin') {
      // Redirect non-admin users to appropriate page based on their role
      if (profile?.role === 'client') {
        navigate('/post-new-job');
      } else {
        navigate('/auth');
      }
    } else if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return null; // Will redirect
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
