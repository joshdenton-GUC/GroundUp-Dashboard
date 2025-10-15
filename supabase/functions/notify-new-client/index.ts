import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NotifyNewClientRequest {
  clientId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('[NotifyNewClient] Function invoked');

    const { clientId }: NotifyNewClientRequest = await req.json();
    console.log('[NotifyNewClient] Client ID:', clientId);

    if (!clientId) {
      console.error('[NotifyNewClient] Missing clientId in request');
      return new Response(
        JSON.stringify({ error: 'Missing clientId', success: false }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[NotifyNewClient] Supabase client created');

    // Get client details with profile information
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select(
        `
        id,
        company_name,
        created_at,
        user_id,
        contact_phone,
        address,
        profiles!inner(
          email,
          full_name
        )
      `
      )
      .eq('id', clientId)
      .single();

    if (clientError || !clientData) {
      console.error(
        '[NotifyNewClient] Error fetching client data:',
        clientError
      );
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch client data',
          success: false,
          details: clientError?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[NotifyNewClient] Client data fetched:', {
      id: clientData.id,
      company: clientData.company_name,
      email: clientData.profiles.email,
    });

    // Get admin emails
    const { data: adminProfiles, error: adminError } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin');

    if (adminError) {
      console.error(
        '[NotifyNewClient] Error fetching admin profiles:',
        adminError
      );
    }

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) || [];
    console.log('[NotifyNewClient] Admin emails found:', adminEmails.length);

    // Get configured alert emails for 'client_registered' alert type
    const { data: emailAlerts, error: alertsError } = await supabase
      .from('email_alerts')
      .select('recipient_email')
      .eq('alert_type', 'client_registered')
      .eq('is_active', true);

    if (alertsError) {
      console.error(
        '[NotifyNewClient] Error fetching email alerts:',
        alertsError
      );
    }

    const configuredEmails =
      emailAlerts?.map(a => a.recipient_email).filter(Boolean) || [];
    console.log(
      '[NotifyNewClient] Configured alert emails found:',
      configuredEmails.length
    );

    // Combine all recipient emails, removing duplicates
    const allRecipients = Array.from(
      new Set([...adminEmails, ...configuredEmails])
    );

    console.log('[NotifyNewClient] Total unique recipients:', allRecipients);

    if (allRecipients.length === 0) {
      console.warn(
        '[NotifyNewClient] No recipients found for client registered alert'
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No recipients configured',
          recipientCount: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the app URL - fallback to production URL if not set
    const appUrl =
      Deno.env.get('VITE_APP_URL') || 'https://groundupcareers.com';
    console.log('[NotifyNewClient] Using app URL:', appUrl);

    // Prepare email data
    const emailData = {
      alertType: 'client_registered',
      recipientEmails: allRecipients,
      clientName: clientData.profiles.full_name || 'Client',
      clientEmail: clientData.profiles.email || '',
      companyName: clientData.company_name || 'Company',
      signupDate: clientData.created_at,
      dashboardUrl: `${appUrl}/dashboard`,
    };

    console.log(
      '[NotifyNewClient] Calling send-email-alert with data:',
      emailData
    );

    // Call the send-email-alert function
    const { data: emailResponse, error: emailError } =
      await supabase.functions.invoke('send-email-alert', { body: emailData });

    if (emailError) {
      console.error(
        '[NotifyNewClient] Error sending client registered email:',
        emailError
      );
      return new Response(
        JSON.stringify({
          error: 'Failed to send email alert',
          success: false,
          details: emailError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[NotifyNewClient] Email response:', emailResponse);
    console.log(
      `[NotifyNewClient] ✅ Client registered alert sent to ${allRecipients.length} recipients`
    );

    return new Response(
      JSON.stringify({
        success: true,
        recipientCount: allRecipients.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in notify-new-client function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
