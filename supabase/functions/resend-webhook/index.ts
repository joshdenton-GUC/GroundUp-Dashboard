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

interface ResendWebhookEvent {
  type:
    | 'email.sent'
    | 'email.delivered'
    | 'email.opened'
    | 'email.bounced'
    | 'email.complained';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    last_event?: string;
  };
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
          message: 'resend-webhook function is running',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Only handle POST requests for webhooks
    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Parse the webhook payload
    const webhookPayload = await req.json();
    console.log('Received Resend webhook:', webhookPayload);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process each event in the webhook payload
    if (Array.isArray(webhookPayload)) {
      for (const event of webhookPayload) {
        await processWebhookEvent(event, supabase);
      }
    } else {
      await processWebhookEvent(webhookPayload, supabase);
    }

    return new Response(
      JSON.stringify({
        message: 'Webhook processed successfully',
        success: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in resend-webhook function:', error);
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

async function processWebhookEvent(event: ResendWebhookEvent, supabase: any) {
  try {
    const { type, data } = event;
    const { email_id, to, subject } = data;

    console.log(`Processing webhook event: ${type} for email ${email_id}`);

    switch (type) {
      case 'email.sent':
        // Update email notification status to sent
        await updateEmailStatus(supabase, email_id, 'sent', null);
        break;

      case 'email.delivered':
        // Update email notification status to delivered
        await updateEmailStatus(supabase, email_id, 'delivered', null);
        break;

      case 'email.opened':
        // Update email notification status to opened - this is what we care about for reminders
        await updateEmailStatus(
          supabase,
          email_id,
          'opened',
          new Date().toISOString()
        );
        break;

      case 'email.bounced':
      case 'email.complained':
        // Update email notification status to failed
        await updateEmailStatus(supabase, email_id, 'failed', null);
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
  }
}

async function updateEmailStatus(
  supabase: any,
  emailId: string,
  status: string,
  openedAt: string | null
) {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (openedAt) {
      updateData.opened_at = openedAt;
    }

    const { error } = await supabase
      .from('email_notifications')
      .update(updateData)
      .eq('resend_email_id', emailId);

    if (error) {
      console.error('Error updating email status:', error);
    } else {
      console.log(`Updated email ${emailId} status to ${status}`);
    }
  } catch (error) {
    console.error('Error in updateEmailStatus:', error);
  }
}

serve(handler);
