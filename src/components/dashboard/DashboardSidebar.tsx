import React, { useState, useEffect, useCallback } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Plus,
  Users,
  Briefcase,
  Clock,
  UserCheck,
  FileText,
  LogOut,
  AlertCircle,
  UserPen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import groundUpLogo from '@/assets/ground-up-careers-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const menuItems = [
  { title: 'Post New Job', icon: Plus, path: '/post-new-job' },
  { title: 'Job Staging', icon: Clock, path: '/job-staging' },
  { title: 'Manage Jobs', icon: Briefcase, path: '/manage-jobs' },
  {
    title: 'Review Candidates',
    icon: AlertCircle,
    path: '/review-candidates',
    hasBadge: true,
  },
  { title: 'Manage Candidates', icon: FileText, path: '/manage-candidates' },
  { title: 'Hired Talent', icon: UserCheck, path: '/hired-talent' },
  { title: 'Profile', icon: UserPen, path: '/company-profile' },
  { title: 'How To?', icon: FileText, path: '/how-to' },
];

export function DashboardSidebar() {
  const { profile, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);

  const getClientId = useCallback(async () => {
    if (!user) return;

    try {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientError || !client) {
        console.error('Error fetching client:', clientError);
        return;
      }

      console.log('Client ID found:', client.id);
      setClientId(client.id);
    } catch (error) {
      console.error('Error getting client ID:', error);
    }
  }, [user]);

  // Get client ID on mount
  useEffect(() => {
    if (profile?.role !== 'admin' && user) {
      getClientId();
    }
  }, [profile?.role, user, getClientId]);

  // Define fetchPendingReviewCount with useCallback to avoid recreating on each render
  const fetchPendingReviewCount = useCallback(async () => {
    if (!clientId) {
      console.log('No client ID available yet');
      return;
    }

    try {
      console.log('Fetching pending review count for client:', clientId);
      // Count pending review candidates for this client
      const { count, error } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'pending_review');

      if (!error && count !== null) {
        console.log('Pending review count:', count);
        setPendingReviewCount(count);
      } else if (error) {
        console.error('Error counting candidates:', error);
      }
    } catch (error) {
      console.error('Error fetching pending review count:', error);
    }
  }, [clientId]);

  // Fetch pending review count and set up real-time subscription
  useEffect(() => {
    if (clientId) {
      console.log('Setting up subscription for client:', clientId);
      fetchPendingReviewCount();

      // Set up real-time subscription for this client's candidates
      const channel = supabase
        .channel('candidates-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'candidates',
            filter: `client_id=eq.${clientId}`,
          },
          payload => {
            console.log('Candidate change detected for client:', payload);
            fetchPendingReviewCount();
          }
        )
        .subscribe(status => {
          console.log('Subscription status:', status);
        });

      // Listen for custom refresh event from ReviewCandidatesPage
      const handleRefresh = () => {
        console.log('Manual refresh triggered');
        fetchPendingReviewCount();
      };
      window.addEventListener('refreshPendingCount', handleRefresh);

      return () => {
        console.log('Cleaning up subscription');
        supabase.removeChannel(channel);
        window.removeEventListener('refreshPendingCount', handleRefresh);
      };
    }
  }, [clientId, fetchPendingReviewCount]);

  // Add dashboard item for admin users
  const items =
    profile?.role === 'admin'
      ? [{ title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }]
      : menuItems;

  return (
    <Sidebar className="bg-zinc-900 border-zinc-800 w-64">
      <SidebarHeader
        className="p-6 border-b border-orange/20 bg-[#ffa708]"
        style={{ padding: '19.5px' }}
      >
        <div className="flex items-center justify-center">
          <img
            src={groundUpLogo}
            alt="Ground Up Careers"
            className="h-8 w-auto"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-zinc-900">
        <SidebarGroup>
          <SidebarGroupContent className="p-4">
            <SidebarMenu>
              {items.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left p-3 rounded text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center space-x-3 transition-all duration-200 font-medium tracking-wide ${
                      location.pathname === item.path
                        ? 'hover:bg-orange-light hover:text-orange-light-foreground bg-orange-light text-orange-light-foreground shadow-lg'
                        : ''
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm font-medium text-nowrap">
                      {item.title}
                    </span>
                    {item.hasBadge && pendingReviewCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="bg-red-500 text-white h-5 min-w-5 flex items-center justify-center px-1.5"
                        style={{ marginLeft: '0' }}
                      >
                        {pendingReviewCount}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={signOut}
                  className="w-full text-left p-3 rounded text-zinc-300 hover:bg-red-600 hover:text-white flex items-center space-x-3 transition-all duration-200 font-medium tracking-wide"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
