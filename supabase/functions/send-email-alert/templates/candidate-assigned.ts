import type { EmailContent, CandidateAssignedData } from './types.ts';

/**
 * Email template for candidate assigned notifications
 */
export function generateCandidateAssignedEmail(
  data: CandidateAssignedData
): EmailContent {
  return {
    from: 'Ground Up Careers <noreply@groundupcareers.com>',
    subject: `New Candidate Assigned to ${data.companyName}: ${data.candidateName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Candidate Assigned</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        
        <!-- Email Container -->
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #10b981; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                New Candidate Assigned
              </h1>
              <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">
                Action Required - Review Candidate
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Alert Notice -->
              <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <div style="width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <span style="color: white; font-size: 16px; font-weight: bold;">✓</span>
                  </div>
                  <h2 style="margin: 0; color: #047857; font-size: 20px; font-weight: 600;">
                    New Candidate Ready for Review
                  </h2>
                </div>
                <p style="margin: 0; color: #047857; font-size: 16px; line-height: 1.5;">
                  A new candidate has been assigned to <strong>${
                    data.companyName
                  }</strong> and is pending your review.
                </p>
              </div>
              
              <!-- Candidate Information -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                  Candidate Details
                </h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 30%;">Candidate Name</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${
                      data.candidateName
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      <a href="mailto:${
                        data.candidateEmail
                      }" style="color: #10b981; text-decoration: none;">${
      data.candidateEmail
    }</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Assigned To</td>
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
                  ${
                    data.clientEmail
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Contact Email</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                      <a href="mailto:${data.clientEmail}" style="color: #10b981; text-decoration: none;">${data.clientEmail}</a>
                    </td>
                  </tr>
                  `
                      : ''
                  }
                </table>
              </div>

              ${
                data.candidateSkills && data.candidateSkills.length > 0
                  ? `
              <!-- Skills Section -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                  Key Skills
                </h3>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${data.candidateSkills
                    .map(
                      skill => `
                    <span style="background-color: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 500; display: inline-block;">
                      ${skill}
                    </span>
                  `
                    )
                    .join('')}
                </div>
              </div>
              `
                  : `
              <!-- Skills Section -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                  Key Skills
                </h3>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  <span style="background-color: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 6px; font-size: 14px; font-weight: 500; display: inline-block;">
                    Skills not mentioned
                  </span>
                </div>
              </div>
              `
              }

              <!-- Professional Summary -->
              <div style="background-color: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: #854d0e; font-size: 16px; font-weight: 600;">
                  Professional Summary
                </h3>
                <p style="margin: 0; color: #854d0e; font-size: 14px; line-height: 1.6;">
                  ${data.candidateSummary || 'Summary not mentioned'}
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
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
                  <a href="mailto:support@groundupcareers.com" style="color: #10b981; text-decoration: none;">support@groundupcareers.com</a>
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
