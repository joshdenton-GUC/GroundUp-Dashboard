import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { generateNewJobPostedEmail } from './templates/new-job-posted.ts';
import { generateCandidateAssignedEmail } from './templates/candidate-assigned.ts';
import { generateNoSaleJobStagedEmail } from './templates/no-sale-job-staged.ts';
import { generateJobStatusUpdateEmail } from './templates/job-status-update.ts';
import { generateClientRegisteredEmail } from './templates/client-registered.ts';
import { generateResumeRejectionEmail } from './templates/resume-rejection.ts';

// Initialize Resend if API key is available
let resend: any = null;
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

interface EmailAlertRequest {
  alertType: string;
  recipientEmails: string[];
  clientName?: string;
  clientEmail?: string;
  jobTitle?: string;
  signupDate?: string;
  dashboardUrl?: string;
  jobStatus?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateSkills?: string[];
  candidateSummary?: string;
  resumeUrl?: string;
  companyName?: string;
  applicationDate?: string;
  jobUrl?: string;
  candidateId?: string;
  clientId?: string;
}

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
          message: 'send-email-alert function is running',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse the request body
    const parsedBody = await req.json();
    console.log('Received email alert request:', parsedBody);

    const {
      alertType,
      recipientEmails,
      clientName,
      clientEmail,
      jobTitle,
      signupDate,
      dashboardUrl,
      jobStatus,
      candidateName,
      candidateEmail,
      candidateSkills,
      candidateSummary,
      resumeUrl,
      companyName,
      applicationDate,
      jobUrl,
      candidateId,
      clientId,
    }: EmailAlertRequest = parsedBody;

    if (!alertType) {
      return new Response(
        JSON.stringify({
          error: 'Missing required field: alertType',
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

    // Helpers to normalize and validate emails
    const normalizeEmail = (e: string) => (e || '').trim().toLowerCase();
    const isValidEmail = (e: string) =>
      /^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(
        e
      );

    // If recipientEmails not provided, fetch admin emails and configured recipients
    let finalRecipientEmails = recipientEmails || [];

    if (!recipientEmails || recipientEmails.length === 0) {
      console.log('No recipient emails provided, fetching from database...');

      // Get admin emails (all users with admin role)
      const { data: adminProfiles, error: adminError } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'admin');

      if (adminError) {
        console.error('Error fetching admin profiles:', adminError);
      }

      const adminEmails =
        adminProfiles?.map(p => p.email).filter(Boolean) || [];
      console.log(`Found ${adminEmails.length} admin emails`);

      // Get configured alert emails for this alert type
      const { data: emailAlerts, error: alertsError } = await supabase
        .from('email_alerts')
        .select('recipient_email')
        .eq('alert_type', alertType)
        .eq('is_active', true);

      if (alertsError) {
        console.error('Error fetching email alerts:', alertsError);
      }

      const configuredEmails =
        emailAlerts?.map(a => a.recipient_email).filter(Boolean) || [];
      console.log(
        `Found ${configuredEmails.length} configured emails for ${alertType}`
      );

      // Combine all recipient emails (admin + configured)
      finalRecipientEmails = [...adminEmails, ...configuredEmails];
      console.log(`Total recipients: ${finalRecipientEmails.length}`);

      if (finalRecipientEmails.length === 0) {
        console.warn(`No recipients found for alert type: ${alertType}`);
        return new Response(
          JSON.stringify({
            message: 'No recipients configured for this alert type',
            successCount: 0,
            failureCount: 0,
            emailsSent: false,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }
    // Normalize, dedupe, and validate recipients
    finalRecipientEmails = Array.from(
      new Set(finalRecipientEmails.map(normalizeEmail).filter(e => !!e))
    ).filter(isValidEmail);

    if (finalRecipientEmails.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No valid recipient emails after normalization',
          successCount: 0,
          failureCount: 0,
          emailsSent: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const appUrl =
      Deno.env.get('VITE_APP_URL') || 'https://groundupcareers.com';

    // Generate email content based on alert type
    let emailContent;

    switch (alertType) {
      case 'new_job_posted':
        emailContent = generateNewJobPostedEmail({
          jobTitle: jobTitle || 'Job Posting',
          companyName: companyName || 'Company',
          clientName: clientName || 'Client',
          clientEmail: clientEmail || '',
          dashboardUrl: dashboardUrl || `${appUrl}dashboard`,
        });
        break;

      case 'candidate_assigned':
        emailContent = generateCandidateAssignedEmail({
          candidateName: candidateName || 'Candidate',
          candidateEmail: candidateEmail || '',
          candidateSkills: candidateSkills || [],
          candidateSummary: candidateSummary || '',
          clientName: clientName || 'Client',
          companyName: companyName || 'Company',
          dashboardUrl: dashboardUrl || `${appUrl}dashboard`,
          clientEmail: clientEmail,
        });
        break;

      case 'no_sale_job_staged':
        emailContent = generateNoSaleJobStagedEmail({
          clientName: clientName || 'Client',
          clientEmail: clientEmail || '',
          jobTitle: jobTitle || 'Job Posting',
          signupDate: signupDate || new Date().toISOString(),
          dashboardUrl: dashboardUrl || `${appUrl}dashboard`,
        });
        break;

      case 'job_status_update':
        emailContent = generateJobStatusUpdateEmail({
          clientName: clientName || 'Client',
          clientEmail: clientEmail || '',
          jobTitle: jobTitle || 'Job Posting',
          jobStatus: jobStatus || 'filled',
          candidateName: candidateName,
          dashboardUrl: dashboardUrl || `${appUrl}dashboard`,
        });
        break;

      case 'client_registered':
        emailContent = generateClientRegisteredEmail({
          clientName: clientName || 'Client',
          clientEmail: clientEmail || '',
          companyName: companyName || 'Company',
          signupDate: signupDate || new Date().toISOString(),
          dashboardUrl: dashboardUrl || `${appUrl}dashboard`,
        });
        break;

      case 'resume_rejection':
        emailContent = generateResumeRejectionEmail({
          candidateName: candidateName || 'Candidate',
          candidateEmail: candidateEmail || '',
          clientName: clientName || 'Client',
          companyName: companyName || 'Company',
          rejectionDate: new Date().toISOString(),
          dashboardUrl: dashboardUrl || `${appUrl}dashboard`,
        });
        break;

      default:
        return new Response(
          JSON.stringify({
            error: `Unknown alert type: ${alertType}`,
            success: false,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    // Send email notifications (BCC batching with retry/backoff)
    let successCount = 0;
    let failureCount = 0;

    const batchSize = 50; // safe batch size for BCC

    async function sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function sendBatch(batch: string[]) {
      if (!resend) {
        console.log(`Email alert (Resend not available):`, {
          alertType,
          recipients: batch,
          subject: emailContent.subject,
        });
        // Simulate tracking
        for (const email of batch) {
          try {
            const { error: trackError } = await supabase
              .from('email_notifications')
              .insert({
                candidate_id: candidateId,
                client_id: clientId,
                recipient_email: email,
                email_type: alertType,
                subject: emailContent.subject,
                status: 'logged',
                resend_email_id: 'logged-only',
              });
            if (trackError) {
              console.error('Error tracking email notification:', trackError);
            }
          } catch (trackError) {
            console.error('Error tracking email notification:', trackError);
          }
        }
        successCount += batch.length;
        return;
      }

      // Resend requires a "to"; use first address as TO and the rest as BCC
      const toAddress = batch[0];
      const bccAddresses = batch.slice(1);

      // Retry with exponential backoff for 429/5xx
      const maxAttempts = 4;
      let attempt = 0;
      while (attempt < maxAttempts) {
        try {
          const result = await resend.emails.send({
            ...emailContent,
            to: [toAddress],
            bcc: bccAddresses,
          });

          // Track per recipient (reuse the same resend id)
          if (result && result.id) {
            for (const email of batch) {
              try {
                const { error: trackError } = await supabase
                  .from('email_notifications')
                  .insert({
                    candidate_id: candidateId,
                    client_id: clientId,
                    recipient_email: email,
                    email_type: alertType,
                    subject: emailContent.subject,
                    status: 'sent',
                    resend_email_id: result.id,
                  });
                if (trackError) {
                  console.error(
                    'Error tracking email notification:',
                    trackError
                  );
                }
              } catch (trackError) {
                console.error('Error tracking email notification:', trackError);
              }
            }
          }

          successCount += batch.length;
          return;
        } catch (err: any) {
          attempt++;
          const status = err?.status || err?.code;
          const isRetryable = status === 429 || (status >= 500 && status < 600);
          if (attempt < maxAttempts && isRetryable) {
            const delay = 500 * Math.pow(2, attempt - 1); // 0.5s, 1s, 2s
            console.warn(
              `Resend send failed (attempt ${attempt}/${maxAttempts}) - retrying in ${delay}ms`,
              err
            );
            await sleep(delay);
            continue;
          }
          console.error(
            'Resend send failed permanently for batch:',
            batch,
            err
          );
          failureCount += batch.length;
          return;
        }
      }
    }

    // Sequentially process batches to respect rate limits
    for (let i = 0; i < finalRecipientEmails.length; i += batchSize) {
      const batch = finalRecipientEmails.slice(i, i + batchSize);
      await sendBatch(batch);
      // Small pacing delay to be nice to the API on Free plan
      await sleep(150);
    }

    console.log(
      `Email alerts sent: ${successCount} successful, ${failureCount} failed`
    );

    // If any failures occurred, log a generic warning (details were logged above)
    if (failureCount > 0) {
      console.error('Some email alerts failed. See logs above for details.');
    }

    const message = resend
      ? `Email alerts sent to ${successCount} recipients`
      : `Email alerts logged for ${successCount} recipients (Resend API not configured)`;

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
    console.error('Error in send-email-alert function:', error);
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
