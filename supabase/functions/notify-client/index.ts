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
    console.log('RESEND_API_KEY not found, email sending will be logged only');
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

interface NotifyClientRequest {
  candidateName: string;
  candidateEmail?: string;
  candidateSkills?: string[];
  candidateSummary?: string;
  candidateEducation?: string;
  candidateLocation?: string;
  candidatePosition?: string;
  clientEmails?: string[];
  candidateId?: string;
  clientId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
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
          message: 'notify-client function is running',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    // Parse the request body
    const parsedBody = await req.json();
    console.log('Received request body:', parsedBody);

    // Extract the actual data from the Supabase client format
    const actualData = parsedBody.body || parsedBody;
    console.log('Extracted actual data:', actualData);

    const {
      candidateName,
      candidateEmail,
      candidateSkills,
      candidateSummary,
      candidateEducation,
      candidateLocation,
      candidatePosition,
      clientEmails,
      candidateId,
      clientId,
    }: NotifyClientRequest = actualData;

    console.log('Notifying clients about new candidate:', candidateName);

    // Validate that client emails are provided
    if (!clientEmails || clientEmails.length === 0) {
      console.error('No client emails provided');
      return new Response(
        JSON.stringify({
          error:
            'Client emails are required. Please provide at least one email address.',
          success: false,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const appUrl = Deno.env.get('VITE_APP_URL');

    // Use the provided client emails
    const emailList = clientEmails;
    console.log(
      'Sending targeted notification to specific clients:',
      emailList
    );

    // Create skills list for email
    const skillsList =
      candidateSkills && candidateSkills.length > 0
        ? candidateSkills.join(', ')
        : 'Not specified';

    // Prepare email content
    const emailContent = {
      from: 'Ground Up Careers <noreply@groundupcareers.com>',
      to: emailList,
      subject: `New Candidate Match: ${candidateName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
              New Candidate Match
            </h1>
          </div>

          <!-- Main Content -->
          <div style="padding: 20px;">
            
            <!-- Candidate Information -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 20px; font-weight: bold;">${candidateName}</h2>
              ${
                candidatePosition
                  ? `<p style="margin: 0 0 10px 0; color: #2563eb;"><strong>Position:</strong> ${candidatePosition}</p>`
                  : ''
              }
              ${
                candidateLocation
                  ? `<p style="margin: 0 0 10px 0; color: #64748b;"><strong>Location:</strong> ${candidateLocation}</p>`
                  : ''
              }
              ${
                candidateEducation
                  ? `<p style="margin: 0 0 10px 0; color: #64748b;"><strong>Education:</strong> ${candidateEducation}</p>`
                  : ''
              }
              
              <p style="margin: 0 0 10px 0; color: #374151;"><strong>Skills:</strong> ${skillsList}</p>
              
              ${
                candidateSummary
                  ? `
              <div style="margin-top: 15px;">
                <strong>Summary:</strong>
                <p style="margin: 5px 0; color: #4b5563; line-height: 1.5;">${candidateSummary}</p>
              </div>
              `
                  : ''
              }
            </div>

            <!-- Message -->
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              This candidate has been matched to your requirements and is ready for review.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 20px 0;">
              <a href="${appUrl}review-candidates" 
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

    // Send email notifications and track them
    let emailPromises;
    if (resend) {
      // Use Resend API if available
      emailPromises = emailList.map(async email => {
        // Send email
        const result = await resend.emails.send({
          ...emailContent,
          to: [email],
        });

        // Track the email notification in database
        if (result && result.id) {
          try {
            // Try to find candidate and client IDs if not provided
            let finalCandidateId = candidateId;
            let finalClientId = clientId;

            // If candidate ID not provided, try to find it by name and email
            if (!finalCandidateId && candidateName) {
              const { data: candidateData } = await supabase
                .from('candidates')
                .select('id')
                .eq('full_name', candidateName)
                .limit(1)
                .single();
              if (candidateData) {
                finalCandidateId = candidateData.id;
              }
            }

            // If client ID not provided, try to find it by email
            if (!finalClientId && email) {
              const { data: clientData } = await supabase
                .from('clients')
                .select(
                  `
                  id,
                  profiles!inner(
                    email
                  )
                `
                )
                .eq('profiles.email', email)
                .limit(1)
                .single();
              if (clientData) {
                finalClientId = clientData.id;
              }
            }

            const { error: trackError } = await supabase
              .from('email_notifications')
              .insert({
                candidate_id: finalCandidateId,
                client_id: finalClientId,
                recipient_email: email,
                email_type: 'initial',
                subject: emailContent.subject,
                status: 'sent',
                resend_email_id: result.id, // Store Resend email ID for webhook tracking
              });

            if (trackError) {
              console.error('Error tracking email notification:', trackError);
            }
          } catch (trackError) {
            console.error('Error tracking email notification:', trackError);
          }
        }

        return result;
      });
    } else {
      // Fallback: just log the email content
      console.log('Email notification (Resend not available):', {
        recipients: emailList,
        subject: emailContent.subject,
        candidateName,
      });
      emailPromises = emailList.map(() =>
        Promise.resolve({ id: 'logged-only' })
      );
    }

    const results = await Promise.allSettled(emailPromises);

    const successCount = results.filter(
      result => result.status === 'fulfilled'
    ).length;
    const failureCount = results.filter(
      result => result.status === 'rejected'
    ).length;

    console.log(
      `Email notifications sent: ${successCount} successful, ${failureCount} failed`
    );

    if (failureCount > 0) {
      console.error(
        'Some email notifications failed:',
        results
          .filter(result => result.status === 'rejected')
          .map(r => r.reason)
      );
    }

    const message = resend
      ? `Email notifications sent to ${successCount} recipients`
      : `Email notifications logged for ${successCount} recipients (Resend API not configured)`;

    return new Response(
      JSON.stringify({
        message,
        successCount,
        failureCount,
        emailsSent: !!resend,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in notify-client function:', error);
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
