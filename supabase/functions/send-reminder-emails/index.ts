import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// Initialize Resend if API key is available
let resend = null;
try {
  const { Resend } = await import('npm:resend@2.0.0');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (resendApiKey) {
    resend = new Resend(resendApiKey);
    console.log('Resend initialized successfully');
  } else {
    console.log(
      'RESEND_API_KEY not found, reminder emails will be logged only'
    );
  }
} catch (error) {
  console.log('Failed to initialize Resend:', error.message);
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('OK', {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Handle GET requests for health check
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          message: 'send-reminder-emails function is running',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const appUrl = Deno.env.get('VITE_APP_URL');

    // Get unopened emails that need reminders
    const { data: unopenedEmails, error: fetchError } = await supabase.rpc(
      'get_unopened_emails_for_reminder'
    );

    if (fetchError) {
      console.error('Error fetching unopened emails:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch unopened emails',
          success: false,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!unopenedEmails || unopenedEmails.length === 0) {
      console.log('No unopened emails found for reminders');
      return new Response(
        JSON.stringify({
          message: 'No unopened emails found for reminders',
          success: true,
          remindersSent: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${unopenedEmails.length} unopened emails for reminders`);

    let successCount = 0;
    let failureCount = 0;

    // Process each unopened email
    for (const emailData of unopenedEmails) {
      try {
        // Create skills list for email
        const skillsList =
          emailData.candidate_skills && emailData.candidate_skills.length > 0
            ? emailData.candidate_skills.join(', ')
            : 'Not specified';

        // Prepare reminder email content
        const emailContent = {
          from: 'Ground Up Careers <hello@groundupcareers.com>',
          to: [emailData.recipient_email],
          subject: `Reminder: New Candidate Match - ${emailData.candidate_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              
              <!-- Header -->
              <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
                  Reminder: New Candidate Match
                </h1>
              </div>

              <!-- Main Content -->
              <div style="padding: 20px;">
                
                <!-- Reminder Notice -->
                <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #92400e; font-weight: bold;">
                    📧 This is a reminder - you received a candidate match yesterday that hasn't been reviewed yet.
                  </p>
                </div>
                
                <!-- Candidate Information -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 20px; font-weight: bold;">${
                    emailData.candidate_name
                  }</h2>
                  ${
                    emailData.candidate_position
                      ? `<p style="margin: 0 0 10px 0; color: #2563eb;"><strong>Position:</strong> ${emailData.candidate_position}</p>`
                      : ''
                  }
                  ${
                    emailData.candidate_location
                      ? `<p style="margin: 0 0 10px 0; color: #64748b;"><strong>Location:</strong> ${emailData.candidate_location}</p>`
                      : ''
                  }
                  ${
                    emailData.candidate_email
                      ? `<p style="margin: 0 0 10px 0; color: #64748b;">Email: <a href="mailto:${emailData.candidate_email}" style="color: #2563eb; text-decoration: none;">${emailData.candidate_email}</a></p>`
                      : ''
                  }
                  
                  <p style="margin: 0 0 10px 0; color: #374151;"><strong>Skills:</strong> ${skillsList}</p>
                  
                  ${
                    emailData.candidate_summary
                      ? `
                  <div style="margin-top: 15px;">
                    <strong>Summary:</strong>
                    <p style="margin: 5px 0; color: #4b5563; line-height: 1.5;">${emailData.candidate_summary}</p>
                  </div>
                  `
                      : ''
                  }
                </div>

                <!-- Message -->
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                  This candidate has been matched to your requirements and is ready for review. Please don't miss out on this opportunity!
                </p>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${appUrl}manage-candidates" 
                     style="background-color: #f97316; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Review Candidate Now
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

        // Send reminder email
        let emailResult;
        if (resend) {
          emailResult = await resend.emails.send(emailContent);
        } else {
          // Fallback: just log the email content
          console.log('Reminder email (Resend not available):', {
            recipient: emailData.recipient_email,
            subject: emailContent.subject,
            candidateName: emailData.candidate_name,
          });
          emailResult = { id: 'logged-only' };
        }

        // Mark reminder as sent in database
        const { error: updateError } = await supabase.rpc(
          'mark_reminder_sent',
          { notification_id: emailData.id }
        );

        if (updateError) {
          console.error('Error marking reminder as sent:', updateError);
        }

        // Insert new email notification record for the reminder
        const { error: insertError } = await supabase
          .from('email_notifications')
          .insert({
            candidate_id: emailData.candidate_id,
            client_id: emailData.client_id,
            recipient_email: emailData.recipient_email,
            email_type: 'reminder',
            subject: emailContent.subject,
            status: 'sent',
            resend_email_id: emailResult?.id || null, // Store Resend email ID for webhook tracking
          });

        if (insertError) {
          console.error('Error inserting reminder notification:', insertError);
        }

        successCount++;
        console.log(
          `Reminder sent successfully to ${emailData.recipient_email} for candidate ${emailData.candidate_name}`
        );
      } catch (error: any) {
        failureCount++;
        console.error(
          `Failed to send reminder to ${emailData.recipient_email}:`,
          error
        );
      }
    }

    const message = resend
      ? `Reminder emails sent: ${successCount} successful, ${failureCount} failed`
      : `Reminder emails logged: ${successCount} successful, ${failureCount} failed (Resend API not configured)`;

    return new Response(
      JSON.stringify({
        message,
        successCount,
        failureCount,
        totalProcessed: unopenedEmails.length,
        emailsSent: !!resend,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-reminder-emails function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
