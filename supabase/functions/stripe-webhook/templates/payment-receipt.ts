import type { EmailContent, PaymentReceiptData } from './types.ts';

/**
 * Generates a payment receipt email for successful job posting payments
 *
 * @param data - Payment receipt data including invoice details and job information
 * @returns EmailContent object ready to be sent via Resend
 */
export function generatePaymentReceiptEmail(
  data: PaymentReceiptData
): EmailContent {
  const {
    invoiceNumber,
    paymentDate,
    amount,
    paymentMethod,
    transactionId,
    recipientEmail,
    jobPost,
  } = data;

  return {
    from: 'Ground Up Careers <noreply@groundupcareers.com>',
    to: [recipientEmail],
    subject: `Receipt for ${jobPost.title} - ${invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        
        <!-- Email Container -->
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
          
          <!-- Header with Orange Banner -->
          <tr>
            <td style="background: #FFA708; padding: 40px 20px; text-align: center;">
              <!-- Logo Circle -->
              <div style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px auto; line-height: 80px; text-align: center;">
                <img src="https://wzlqbrglftrkxrfztcqd.supabase.co/storage/v1/object/public/Media%20Files/GUC-Logo.png" alt="Ground Up Careers" width="50" height="50" style="display: inline-block; vertical-align: middle; border: 0; margin: 0;" />
              </div>
              <div style="color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">
                Ground Up Careers
              </div>
            </td>
          </tr>

          <!-- Title Section -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; text-align: center; background-color: #ffffff;">
              <h1 style="color: #32325d; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                Payment Receipt from Ground Up Careers
              </h1>
              <p style="color: #8898aa; margin: 8px 0 0 0; font-size: 16px;">
                Receipt #${invoiceNumber}
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0 0 0;">
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 20px 30px 40px 30px;">
              
              <!-- Key Payment Details Section -->
              <div style="margin-bottom: 40px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="width: 33.33%; padding-right: 15px; vertical-align: top;">
                      <div style="color: #8898aa; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">PAID</div>
                      <div style="color: #111827; font-size: 24px; font-weight: 600;">$${amount}</div>
                    </td>
                    <td style="width: 33.33%; padding-right: 15px; vertical-align: top;">
                      <div style="color: #8898aa; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">DATE PAID</div>
                      <div style="color: #111827; font-size: 16px; font-weight: 500;">${paymentDate}</div>
                    </td>
                    <td style="width: 33.33%; vertical-align: top;">
                      <div style="color: #8898aa; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">PAID TO</div>
                      <div style="color: #111827; font-size: 16px; font-weight: 500;">${paymentMethod}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Confirmation Message -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <p style="margin: 0; color: #414552!important; font-size: 16px; line-height: 1.6;">
                  This email is to confirm that your payment has been successfully processed by <span style="color: #625afa!important; font-weight: 500">Ground Up Careers</span>. Your job posting is now live and active on our platform. You should start receiving candidate applications soon.
                </p>
              </div>

              <!-- Summary Section -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <div style="margin: 20px 0;">
                <div style="color: #6b7280; font-size: 12px; margin-bottom: 20px; text-transform: uppercase; font-weight: 600;">SUMMARY</div>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse; border-top: 1px solid #e5e7eb; padding-top: 15px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 16px; font-weight: 500;">Job Posting: ${jobPost.title} (${jobPost.classification})</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 16px; font-weight: 500; text-align: right;">$${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 16px; font-weight: 500;">Total</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 16px; font-weight: 500; text-align: right;">$${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 16px; font-weight: 500;">Paid on ${paymentDate}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 16px; font-weight: 500; text-align: right;">$${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0; color: #111827; font-size: 18px; font-weight: 700;">Final total</td>
                    <td style="padding: 15px 0; color: #111827; font-size: 18px; font-weight: 700; text-align: right;">$${amount}</td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Contact Information -->
          <tr>
            <td style="padding: 30px;">
              <div style="margin-bottom: 40px;">
                <p style="margin: 0 0 6px 0; color: #414552!important; font-size: 16px; font-weight: 400;">
                  If you have any questions, contact us at
                </p>
                <div style="margin-bottom: 10px;">
                  <a href="mailto:joshm@groundupcareers.com" style="color: #625afa!important; text-decoration: none; font-size: 16px; font-weight: 500;">joshm@groundupcareers.com</a>
                  <span style="color: #414552!important; font-size: 16px; font-weight: 400;">
                  or call us at
                </span>
                <span>
                  <a href="tel:+17752307151" style="color: #625afa!important; text-decoration: none; font-size: 16px; font-weight: 500;">+1 775-230-7151</a>
                </span>
                </div>
                
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                  Something wrong with the email? 
                  <a href="https://58.email.stripe.com/CL0/https:%2F%2Fdashboard.stripe.com%2Freceipts%2Fpayment%2FCAcQARoXChVhY2N0XzFSN3JJUkRBY0N1OWRVdUQolvi1xwYyBot9Qcnk5zovFq542-dbynadjxu0rhy_GKR0sPlxWB2R3flHhgdScinGiSUCLYScTe37PFGmDDc/1/01000199dfacbb4d-92811764-7d5f-4651-bfeb-af29997c4605-000000/dOZyzorOGMG2F6SMYEZKHwAEkh-QnsLEVOxe_jU1_b0=426" style="color: #2563eb; text-decoration: none;">View it in your browser</a>
                </p>
              </div>
              
              <div>
                <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                  You're receiving this email because you made a purchase at Ground Up Careers, which partners with <strong style="color: #2563eb;">Stripe</strong> to provide invoicing and payment processing.
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
