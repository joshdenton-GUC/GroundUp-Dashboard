import type { EmailContent, NoSaleJobStagedData } from './types.ts';

/**
 * Email template for job staged without payment notifications
 */
export function generateNoSaleJobStagedEmail(
  data: NoSaleJobStagedData
): EmailContent {
  const signupDate = new Date(data.signupDate).toLocaleDateString();

  return {
    from: 'Ground Up Careers <noreply@groundupcareers.com>',
    subject: `Job Staged Without Payment - ${data.jobTitle} by ${data.clientName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Job Staged Without Payment</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        
        <!-- Email Container -->
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #f59e0b; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                ⚠️ Job Staged - No Payment
              </h1>
              <p style="color: #fef3c7; margin: 8px 0 0 0; font-size: 16px;">
                Follow-up Required
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Alert Notice -->
              <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <div style="width: 24px; height: 24px; background-color: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <span style="color: white; font-size: 16px; font-weight: bold;">!</span>
                  </div>
                  <h2 style="margin: 0; color: #92400e; font-size: 20px; font-weight: 600;">
                    Payment Not Completed
                  </h2>
                </div>
                <p style="margin: 0; color: #92400e; font-size: 16px; line-height: 1.5;">
                  A client has saved a job posting as draft but has not completed the payment. The job is currently staged and not visible to candidates.
                </p>
              </div>
              
              <!-- Client & Job Information -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                  Client & Job Details
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 35%;">Client Name</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.clientName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Client Email</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      <a href="mailto:${data.clientEmail}" style="color: #f59e0b; text-decoration: none;">${data.clientEmail}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Job Title</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.jobTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date Created</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">${signupDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status</td>
                    <td style="padding: 8px 0;">
                      <span style="color: #111827; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">STAGED - UNPAID</span>
                    </td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 8px 0; color: #111827; font-size: 16px; font-weight: 600;">
                  Ground Up Careers - Admin Alert
                </h4>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  Internal notification system
                </p>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  This is an automated admin notification. 
                  For questions, contact support at 
                  <a href="mailto:support@groundupcareers.com" style="color: #f59e0b; text-decoration: none;">support@groundupcareers.com</a>
                </p>
              </div>
            </td>
          </tr>

        </table>
      </body>
      </html>
    `,
  };
}
