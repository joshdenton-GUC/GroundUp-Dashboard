import type { EmailContent, ResumeRejectionData } from './types.ts';

/**
 * Email template for resume rejection notifications
 */
export function generateResumeRejectionEmail(
  data: ResumeRejectionData
): EmailContent {
  return {
    from: 'Ground Up Careers <noreply@groundupcareers.com>',
    subject: `Resume Rejected: ${data.candidateName} by ${data.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume Rejection Notification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        
        <!-- Email Container -->
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ef4444; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                Resume Rejected
              </h1>
              <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 16px;">
                Client Rejected Candidate
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Alert Notice -->
              <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <div style="width: 24px; height: 24px; background-color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <span style="color: white; font-size: 16px; font-weight: bold;">✗</span>
                  </div>
                  <h2 style="margin: 0; color: #991b1b; font-size: 20px; font-weight: 600;">
                    Client Has Rejected a Candidate
                  </h2>
                </div>
                <p style="margin: 0; color: #991b1b; font-size: 16px; line-height: 1.5;">
                  <strong>${data.clientName}</strong> from <strong>${
      data.companyName
    }</strong> has declined the assigned candidate.
                </p>
              </div>
              
              <!-- Rejection Information -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                  Rejection Details
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 35%;">Candidate Name</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${
                      data.candidateName
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Candidate Email</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      <a href="mailto:${
                        data.candidateEmail
                      }" style="color: #ef4444; text-decoration: none;">${
      data.candidateEmail
    }</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Company Name</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${
                      data.companyName
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Client Contact</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">${
                      data.clientName
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Rejection Date</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">${new Date(
                      data.rejectionDate
                    ).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 20px; text-align: center;">
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 8px 0; color: #111827; font-size: 16px; font-weight: 600;">
                  Ground Up Careers
                </h4>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  Connecting top talent with great opportunities
                </p>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  If you have any questions, contact us at 
                  <a href="mailto:support@groundupcareers.com" style="color: #625afa; text-decoration: none;">support@groundupcareers.com</a>
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
