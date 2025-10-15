import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
          message: 'auto-reminder-trigger function is running',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Auto-reminder trigger started...');

    // Get emails that were sent 24 hours ago and haven't been opened
    const { data: unopenedEmails, error: fetchError } = await supabase
      .from('email_notifications')
      .select(
        `
        id,
        candidate_id,
        client_id,
        recipient_email,
        subject,
        sent_at,
        candidates!inner(full_name, email, skills, summary),
        clients!inner(
          company_name,
          user_id,
          profiles!inner(email)
        )
      `
      )
      .eq('email_type', 'initial')
      .eq('status', 'sent')
      .is('opened_at', null)
      .is('reminder_sent_at', null)
      .lt('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // 24 hours ago

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
      console.log('No unopened emails found for auto-reminders');
      return new Response(
        JSON.stringify({
          message: 'No unopened emails found for auto-reminders',
          success: true,
          remindersSent: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(
      `Found ${unopenedEmails.length} unopened emails for auto-reminders`
    );

    // Call the send-reminder-emails function for each unopened email
    let successCount = 0;
    let failureCount = 0;

    for (const emailData of unopenedEmails) {
      try {
        const { data, error } = await supabase.functions.invoke(
          'send-reminder-emails',
          {
            body: {
              candidateId: emailData.candidate_id,
              clientId: emailData.client_id,
              recipientEmail: emailData.recipient_email,
              candidateName: emailData.candidates.full_name,
              candidateEmail: emailData.candidates.email,
              candidateSkills: emailData.candidates.skills,
              candidateSummary: emailData.candidates.summary,
            },
          }
        );

        if (error) {
          console.error(
            `Failed to send reminder for email ${emailData.id}:`,
            error
          );
          failureCount++;
        } else {
          console.log(`Reminder sent successfully for email ${emailData.id}`);
          successCount++;
        }
      } catch (error: any) {
        console.error(
          `Error processing reminder for email ${emailData.id}:`,
          error
        );
        failureCount++;
      }
    }

    const message = `Auto-reminder trigger completed: ${successCount} successful, ${failureCount} failed`;

    return new Response(
      JSON.stringify({
        message,
        successCount,
        failureCount,
        totalProcessed: unopenedEmails.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in auto-reminder-trigger function:', error);
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
