# Pages Directory Structure

This directory contains all the page components for the application, organized by feature area.

## Directory Structure

```
src/pages/
├── auth/                    # Authentication pages
│   └── AuthPage.tsx        # Sign in/Sign up page
├── dashboard/              # Dashboard pages
│   ├── DashboardLayout.tsx # Main dashboard layout
│   ├── DashboardHome.tsx   # Dashboard home page
│   ├── PostNewJobPage.tsx  # Post new job page
│   ├── ReviewCandidatesPage.tsx # Review candidates page
│   ├── ManageJobsPage.tsx  # Manage jobs page
│   ├── JobStagingPage.tsx  # Job staging page
│   ├── HiredTalentPage.tsx # Hired talent page
│   ├── CandidateInfoPage.tsx # Candidate info page
│   ├── AdminPage.tsx       # Admin panel page
│   └── README.md          # Dashboard routing documentation
├── error/                  # Error pages
│   └── NotFoundPage.tsx   # 404 error page
├── home/                   # Home pages
│   └── HomePage.tsx       # Landing page
├── index.ts               # Main pages export file
└── README.md              # This file
```

## Routing Structure

### Main Routes

- `/` - HomePage (landing page)
- `/auth` - AuthPage (sign in/sign up)
- `/dashboard` - DashboardLayout with nested routes
- `*` - NotFoundPage (404 error)

### Dashboard Nested Routes

- `/dashboard` - DashboardHome (index route)
- `/dashboard/post-new-job` - PostNewJobPage
- `/dashboard/review-candidates` - ReviewCandidatesPage
- `/dashboard/manage-jobs` - ManageJobsPage
- `/dashboard/job-staging` - JobStagingPage
- `/dashboard/hired-talent` - HiredTalentPage
- `/dashboard/candidate-info` - CandidateInfoPage
- `/dashboard/admin` - AdminPage (admin users only)

## Usage

All pages are exported from the main `index.ts` file for easy importing:

```typescript
import { HomePage, AuthPage, DashboardLayout } from '@/pages';
```

## Features

- **Proper Routing**: Each page has its own route with React Router
- **Clean URLs**: Direct, intuitive URL structure
- **Nested Layouts**: Dashboard uses nested routing with shared layout
- **Type Safety**: Full TypeScript support
- **Consistent Structure**: All pages follow the same organizational pattern
