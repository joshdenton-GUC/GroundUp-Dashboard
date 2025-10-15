import type { EmailContent, ClientRegisteredData } from './types.ts';

/**
 * Email template for client registration notifications
 */
export function generateClientRegisteredEmail(
  data: ClientRegisteredData
): EmailContent {
  const signupDate = new Date(data.signupDate).toLocaleDateString();

  return {
    from: 'Ground Up Careers <noreply@groundupcareers.com>',
    subject: `New Client Registration: ${data.companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
            New Client Registration
          </h1>
        </div>

        <!-- Main Content -->
        <div style="padding: 20px;">
          
          <!-- Client Information -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 20px; font-weight: bold;">${data.companyName}</h2>
            <p style="margin: 0 0 10px 0; color: #64748b;">Contact: ${data.clientName} (${data.clientEmail})</p>
            <p style="margin: 0; color: #374151;"><strong>Registration Date:</strong> ${signupDate}</p>
          </div>

          <!-- Message -->
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            A new client has registered on the platform and is ready to start posting jobs.
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.dashboardUrl}" 
               style="background-color: #f97316; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Client Dashboard
            </a>
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
