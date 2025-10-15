# Stripe Webhook Email Templates

This directory contains modular email templates for the Stripe webhook payment processing. Each email type has been separated into its own file for easier maintenance and updates.

## Structure

```
templates/
├── README.md              # This file
├── types.ts               # Shared TypeScript types and interfaces
└── payment-receipt.ts     # Template for payment receipt/invoice emails
```

## Files Overview

### `types.ts`

Contains all shared TypeScript interfaces for email template data:

- `EmailContent` - The return type for all email generators
- `PaymentReceiptData` - Data interface for payment receipt emails

### Email Template Files

#### `payment-receipt.ts`

**Function:** `generatePaymentReceiptEmail(data)`

Generates a professional payment receipt email sent to clients after successful job posting payments.

**Features:**

- Professional invoice design with dark header
- Success confirmation message
- Detailed payment summary (invoice number, date, payment method, transaction ID, total)
- Complete job posting details
- Company footer with support contact

**Theme:** Dark header with green success highlights

**Usage Example:**

```typescript
import { generatePaymentReceiptEmail } from './templates/payment-receipt.ts';

const emailContent = generatePaymentReceiptEmail({
  invoiceNumber: 'INV-ABC12345',
  paymentDate: 'January 15, 2025',
  amount: '299.00',
  paymentMethod: 'CARD',
  transactionId: 'pi_1234567890',
  recipientEmail: 'client@example.com',
  jobPost: {
    title: 'Senior Software Engineer',
    company_name: 'Tech Corp',
    classification: 'Engineering',
    location: 'San Francisco, CA',
    job_type: 'Full-time',
  },
});
```

## Usage in stripe-webhook

The template is imported and used in the main `index.ts` file:

```typescript
import { generatePaymentReceiptEmail } from './templates/payment-receipt.ts';

// In the sendInvoiceEmail function:
const emailContent = generatePaymentReceiptEmail({
  invoiceNumber,
  paymentDate,
  amount,
  paymentMethod: paymentIntent.payment_method_types[0]?.toUpperCase() || 'Card',
  transactionId: paymentIntent.id,
  recipientEmail: client.profiles.email,
  jobPost: {
    title: jobPost.title,
    company_name: jobPost.company_name,
    classification: jobPost.classification,
    location: jobPost.location,
    job_type: jobPost.job_type,
  },
});

// Send via Resend
await resend.emails.send(emailContent);
```

## Adding a New Email Template

To add a new email template for the stripe webhook:

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
       to: [data.recipientEmail],
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

   // Use in your webhook handler
   const emailContent = generateMyNewEmail({ ... });
   await resend.emails.send(emailContent);
   ```

## Email Styling Guidelines

All email templates follow these styling principles:

- **Inline CSS**: All styles are inline for maximum email client compatibility
- **Table-based layout**: Using tables for structure (for older email clients)
- **Responsive**: Max-width of 600px for mobile compatibility
- **Color scheme**:
  - Header: Dark gray (#1f2937)
  - Success: Green (#22c55e, #059669)
  - Background: Light gray (#f8fafc, #f9fafb)
  - Text: Gray scale (#111827, #6b7280, #9ca3af)
  - Accent: Blue (#2563eb for links)

## Template Components

Each payment receipt email includes:

1. **Header Section**: Dark background with invoice title and number
2. **Success Message**: Green highlighted box confirming payment success
3. **Payment Summary**: Detailed transaction information in a table
4. **Job Details**: Complete job posting information
5. **Footer**: Company information and support contact

## Testing

When modifying templates, test across multiple email clients:

- Gmail (web and mobile)
- Outlook (web and desktop)
- Apple Mail
- Mobile clients (iOS Mail, Android Gmail)

## Maintenance Tips

- Keep HTML simple and avoid complex CSS
- Test all changes across multiple email clients
- Use semantic HTML where possible
- Maintain consistent spacing and typography
- Update this README when adding new templates
- Always include fallback text for images
- Use web-safe fonts

## Related

For other email templates in the platform, see:

- `/supabase/functions/send-email-alert/templates/` - Alert email templates
