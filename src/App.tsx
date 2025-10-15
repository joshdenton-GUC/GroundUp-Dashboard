import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { JobHiringProvider } from '@/contexts/JobHiringContext';
import { AuthProvider } from '@/contexts/AuthContext';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import UserProtectedRoute from '@/components/UserProtectedRoute';
import {
  HomePage,
  AuthPage,
  DashboardLayout,
  DashboardHome,
  PostNewJobPage,
  ReviewCandidatesPage,
  ManageJobsPage,
  JobStagingPage,
  HiredTalentPage,
  CandidateInfoPage,
  CompanyProfilePage,
  HowToPage,
  NotFoundPage,
} from './pages';
import PaymentSuccessPage from './pages/dashboard/PaymentSuccessPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <JobHiringProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/dashboard"
                element={
                  <AdminProtectedRoute>
                    <DashboardLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<DashboardHome />} />
              </Route>
              <Route
                path="/post-new-job"
                element={
                  <UserProtectedRoute>
                    <DashboardLayout />
                  </UserProtectedRoute>
                }
              >
                <Route index element={<PostNewJobPage />} />
              </Route>
              <Route
                path="/review-candidates"
                element={
                  <UserProtectedRoute>
                    <DashboardLayout />
                  </UserProtectedRoute>
                }
              >
                <Route index element={<ReviewCandidatesPage />} />
              </Route>
              <Route
                path="/manage-jobs"
                element={
                  <UserProtectedRoute>
                    <DashboardLayout />
                  </UserProtectedRoute>
                }
              >
                <Route index element={<ManageJobsPage />} />
              </Route>
              <Route
                path="/job-staging"
                element={
                  <UserProtectedRoute>
                    <DashboardLayout />
                  </UserProtectedRoute>
                }
              >
                <Route index element={<JobStagingPage />} />
              </Route>
              <Route
                path="/hired-talent"
                element={
                  <UserProtectedRoute>
                    <DashboardLayout />
                  </UserProtectedRoute>
                }
              >
                <Route index element={<HiredTalentPage />} />
              </Route>
              <Route
                path="/manage-candidates"
                element={
                  <UserProtectedRoute>
                    <DashboardLayout />
                  </UserProtectedRoute>
                }
              >
                <Route index element={<CandidateInfoPage />} />
              </Route>
              <Route
                path="/company-profile"
                element={
                  <UserProtectedRoute>
                    <DashboardLayout />
                  </UserProtectedRoute>
                }
              >
                <Route index element={<CompanyProfilePage />} />
              </Route>
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route
                path="/how-to"
                element={
                  <UserProtectedRoute>
                    <DashboardLayout />
                  </UserProtectedRoute>
                }
              >
                <Route index element={<HowToPage />} />
              </Route>
              <Route path="/404" element={<NotFoundPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </JobHiringProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
