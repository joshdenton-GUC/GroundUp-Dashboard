# Dashboard Routing Structure

This directory contains the individual page components for the dashboard section, implementing proper React Router navigation instead of the previous hide/show state-based approach.

## Structure

- `DashboardLayout.tsx` - Main layout wrapper with sidebar and header
- `DashboardHome.tsx` - Default dashboard home page (shows PostNewJob component)
- `PostNewJobPage.tsx` - Post new job page
- `ReviewCandidatesPage.tsx` - Review candidates page
- `ManageJobsPage.tsx` - Manage jobs page
- `JobStagingPage.tsx` - Job staging page
- `HiredTalentPage.tsx` - Hired talent page
- `CandidateInfoPage.tsx` - Candidate info page
- `AdminPage.tsx` - Admin panel page

## Routes

All dashboard routes use direct paths with DashboardLayout:

- `/dashboard` - Dashboard home
- `/post-new-job` - Post new job
- `/review-candidates` - Review candidates
- `/manage-jobs` - Manage jobs
- `/job-staging` - Job staging
- `/hired-talent` - Hired talent
- `/candidate-info` - Candidate info
- `/admin` - Admin panel (admin users only)

## Navigation

The `DashboardSidebar` component now uses React Router's `useNavigate` and `useLocation` hooks for proper URL-based navigation instead of state management.
