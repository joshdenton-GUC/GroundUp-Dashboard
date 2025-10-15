import jsPDF from 'jspdf';

interface JobPost {
  id: string;
  title: string;
  job_type: string;
  classification: string;
  location: string;
  salary: string | null;
  status: string;
  payment_status: string;
  amount_cents: number;
  created_at: string;
  posted_at: string | null;
  expires_at: string | null;
  company_name?: string;
  company_email?: string | null;
}

export const generateJobPDF = (job: JobPost): void => {
  const doc = new jsPDF();

  // Set up fonts and colors
  const primaryColor = '#1f2937'; // gray-800
  const secondaryColor = '#6b7280'; // gray-500
  const accentColor = '#3b82f6'; // blue-500

  // Header
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  const pageWidth = doc.internal.pageSize.width;
  const headerText = 'Job Post Details';
  const headerTextWidth = doc.getTextWidth(headerText);
  const headerX = (pageWidth - headerTextWidth) / 2;
  doc.text(headerText, headerX, 30);

  // Company name
  doc.setFontSize(16);
  doc.setTextColor(accentColor);
  doc.text(job.company_name || 'N/A', 20, 50);

  // Job title
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.text(job.title, 20, 70);

  // Job details section
  doc.setFontSize(14);
  doc.setTextColor(primaryColor);
  doc.text('Job Information', 20, 90);

  // Draw line under section header
  doc.setDrawColor(accentColor);
  doc.line(20, 95, 190, 95);

  // Job details
  let yPosition = 110;
  const lineHeight = 8;

  // Job Type
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.text('Job Type:', 20, yPosition);
  doc.setTextColor(secondaryColor);
  doc.text(job.job_type, 60, yPosition);
  yPosition += lineHeight;

  // Classification
  doc.setTextColor(primaryColor);
  doc.text('Classification:', 20, yPosition);
  doc.setTextColor(secondaryColor);
  doc.text(
    job.classification === 'STANDARD' ? 'Standard' : 'Premium',
    60,
    yPosition
  );
  yPosition += lineHeight;

  // Location
  doc.setTextColor(primaryColor);
  doc.text('Location:', 20, yPosition);
  doc.setTextColor(secondaryColor);
  doc.text(job.location, 60, yPosition);
  yPosition += lineHeight;

  // Salary
  if (job.salary) {
    doc.setTextColor(primaryColor);
    doc.text('Salary:', 20, yPosition);
    doc.setTextColor(secondaryColor);
    doc.text(job.salary, 60, yPosition);
    yPosition += lineHeight;
  }

  // Status
  doc.setTextColor(primaryColor);
  doc.text('Status:', 20, yPosition);
  doc.setTextColor(secondaryColor);
  doc.text(
    job.status.charAt(0).toUpperCase() + job.status.slice(1).replace('_', ' '),
    60,
    yPosition
  );
  yPosition += lineHeight;

  // Payment Status
  doc.setTextColor(primaryColor);
  doc.text('Payment Status:', 20, yPosition);
  doc.setTextColor(job.payment_status === 'completed' ? '#10b981' : '#ef4444');
  doc.text(
    job.payment_status.charAt(0).toUpperCase() + job.payment_status.slice(1),
    60,
    yPosition
  );
  yPosition += lineHeight;

  // Amount
  doc.setTextColor(primaryColor);
  doc.text('Amount:', 20, yPosition);
  doc.setTextColor(secondaryColor);
  doc.text(`$${(job.amount_cents / 100).toLocaleString()}`, 60, yPosition);
  yPosition += lineHeight + 10;

  // Contact information
  if (job.company_email) {
    yPosition += 10;
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text('Contact Information', 20, yPosition);

    // Draw line under section header
    doc.setDrawColor(accentColor);
    doc.line(20, yPosition + 5, 190, yPosition + 5);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text('Email:', 20, yPosition);
    doc.setTextColor(accentColor);
    doc.text(job.company_email, 60, yPosition);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);

  // Company name on the left and generated date on the right in the same row
  doc.text('Ground Up Careers', 20, pageHeight - 15);

  const generatedDate = `Generated on ${new Date().toLocaleDateString()}`;
  const textWidth = doc.getTextWidth(generatedDate);
  doc.text(generatedDate, pageWidth - textWidth - 20, pageHeight - 15);

  // Download the PDF
  const fileName = `job-${job.title
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()}-${job.id.slice(0, 8)}.pdf`;
  doc.save(fileName);
};
