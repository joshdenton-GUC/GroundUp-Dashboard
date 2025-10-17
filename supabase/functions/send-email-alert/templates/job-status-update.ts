import type { EmailContent, JobStatusUpdateData } from './types.ts';

/**
 * Email template for job status update notifications
 */
export function generateJobStatusUpdateEmail(
  data: JobStatusUpdateData
): EmailContent {
  const statusMessages: Record<string, string> = {
    filled: 'Congratulations! Your job has been filled.',
    not_hired:
      'The current candidate was not selected. New resumes are needed.',
    cancelled: 'Your job posting has been cancelled.',
  };

  return {
    from: 'Ground Up Careers <noreply@groundupcareers.com>',
    subject: `Job Status Update: ${data.jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
            Job Status Update
          </h1>
        </div>

        <!-- Main Content -->
        <div style="padding: 20px;">

          <!-- Job Information -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 20px; font-weight: bold;">${
              data.jobTitle
            }</h2>
            <p style="margin: 0 0 10px 0; color: #374151;"><strong>Client:</strong> ${
              data.clientName
            } (${data.clientEmail})</p>
            <p style="margin: 0 0 10px 0; color: #374151;"><strong>Status:</strong> ${data.jobStatus
              .replace('_', ' ')
              .toUpperCase()}</p>
            ${
              data.candidateName
                ? `<p style="margin: 0 0 10px 0; color: #374151;"><strong>Candidate:</strong> ${data.candidateName}</p>`
                : ''
            }
            ${
              data.candidateLocation
                ? `<p style="margin: 0; color: #64748b;"><strong>Location:</strong> ${data.candidateLocation}</p>`
                : ''
            }
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            Best regards,<br>
            Ground Up Careers Team
          </p>
        </div>

      </div>
    `,
  };
}
