import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <DashboardSidebar />
            <SidebarInset className="flex-1">
              <DashboardHeader />
              <main className="flex-1 p-8 bg-gray-100">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
};

export default DashboardLayout;
