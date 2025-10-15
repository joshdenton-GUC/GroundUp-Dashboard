/**
 * Shared types for stripe-webhook email templates
 */

export interface EmailContent {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

export interface PaymentReceiptData {
  invoiceNumber: string;
  paymentDate: string;
  amount: string;
  paymentMethod: string;
  transactionId: string;
  recipientEmail: string;
  jobPost: {
    title: string;
    company_name: string;
    classification: string;
    location: string;
    job_type: string;
  };
}
