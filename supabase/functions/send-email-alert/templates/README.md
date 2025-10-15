# Email Alert Templates

This directory contains modular email templates for the Ground Up Careers platform. Each email alert type has been separated into its own file for easier maintenance and updates.

## Structure

```
templates/
├── README.md                    # This file
├── types.ts                     # Shared TypeScript types and interfaces
├── new-job-posted.ts           # Template for new job posting notifications
├── candidate-assigned.ts        # Template for candidate assignment notifications
├── no-sale-job-staged.ts       # Template for unpaid job staging notifications
├── job-status-update.ts        # Template for job status change notifications
├── new-resume-uploaded.ts      # Template for new resume upload notifications
└── client-registered.ts        # Template for new client registration notifications
```

## Files Overview

### `types.ts`

Contains all shared TypeScript interfaces for email template data:

- `EmailContent` - The return type for all email generators
- `NewJobPostedData` - Data interface for new job posted emails
- `CandidateAssignedData` - Data interface for candidate assigned emails
- `NoSaleJobStagedData` - Data interface for no-sale job staged emails
- `JobStatusUpdateData` - Data interface for job status update emails
- `NewResumeUploadedData` - Data interface for new resume uploaded emails
- `ClientRegisteredData` - Data interface for client registered emails

### Email Template Files

Each template file exports a single function that generates email content:

- **`new-job-posted.ts`** - `generateNewJobPostedEmail(data)`

  - Sent when a client successfully posts and pays for a new job
  - Green/success theme

- **`candidate-assigned.ts`** - `generateCandidateAssignedEmail(data)`

  - Sent when a candidate is assigned to a client's job
  - Green theme with candidate details

- **`no-sale-job-staged.ts`** - `generateNoSaleJobStagedEmail(data)`

  - Sent when a job is staged but payment not completed
  - Amber/warning theme

- **`job-status-update.ts`** - `generateJobStatusUpdateEmail(data)`

  - Sent when a job status changes (filled, not_hired, cancelled)
  - Orange theme

- **`client-registered.ts`** - `generateClientRegisteredEmail(data)`
  - Sent when a new client registers on the platform
  - Orange theme

## Usage

All templates are imported and used in the main `index.ts` file:

```typescript
import { generateNewJobPostedEmail } from './templates/new-job-posted.ts';
import { generateCandidateAssignedEmail } from './templates/candidate-assigned.ts';
// ... other imports

// Then used in the switch statement:
switch (alertType) {
  case 'new_job_posted':
    emailContent = generateNewJobPostedEmail({
      jobTitle,
      companyName,
      clientName,
      clientEmail,
      dashboardUrl,
    });
    break;
  // ... other cases
}
```

## Adding a New Email Template

To add a new email template:

1. **Create a new interface** in `types.ts`:

   ```typescript
   export interface MyNewEmailData {
     field1: string;
     field2?: string;
   }
   ```

2. **Create a new template file** (e.g., `my-new-email.ts`):

   ```typescript
   import type { EmailContent, MyNewEmailData } from './types.ts';

   export function generateMyNewEmail(data: MyNewEmailData): EmailContent {
     return {
       from: 'Ground Up Careers <noreply@groundupcareers.com>',
       subject: 'Your Subject Here',
       html: `
         <!-- Your HTML template here -->
       `,
     };
   }
   ```

3. **Import and use** in `index.ts`:

   ```typescript
   import { generateMyNewEmail } from './templates/my-new-email.ts';

   // Add to switch statement
   case 'my_new_alert':
     emailContent = generateMyNewEmail({ ... });
     break;
   ```

## Email Styling Guidelines

All email templates follow these styling principles:

- **Inline CSS**: All styles are inline for maximum email client compatibility
- **Table-based layout**: Using tables for structure (for older email clients)
- **Responsive**: Max-width of 600px for mobile compatibility
- **Color scheme**:
  - Success/Active: Green (#10b981)
  - Warning: Amber (#f59e0b)
  - Info: Orange (#f97316)
  - Neutral: Gray scale

## Testing

When modifying templates, test across multiple email clients:

- Gmail (web and mobile)
- Outlook (web and desktop)
- Apple Mail
- Mobile clients (iOS Mail, Android Gmail)

## Maintenance

- Keep templates simple and focused
- Avoid complex CSS or JavaScript
- Test all changes thoroughly
- Update this README when adding new templates
