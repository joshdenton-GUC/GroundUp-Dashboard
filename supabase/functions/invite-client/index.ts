import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key (has admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the user from the auth header
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const {
      email,
      fullName,
      companyName,
      contactPhone,
      street1,
      street2,
      city,
      state,
      zip,
    } = await req.json();

    // Validate required fields
    if (!email || !fullName || !companyName) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: email, fullName, companyName',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if email already exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('email, role, user_id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({
          error: 'duplicate_email',
          message: `A user with email "${email}" already exists in the system.`,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // Invite user via email
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          role: 'client',
        },
        redirectTo: `${
          req.headers.get('origin') || Deno.env.get('SITE_URL')
        }/auth/callback`,
      });

    if (authError) {
      console.error('Auth error:', authError);

      // Handle specific auth errors
      if (
        authError.message?.includes('already registered') ||
        authError.message?.includes('already exists') ||
        authError.message?.includes('User already registered')
      ) {
        return new Response(
          JSON.stringify({
            error: 'duplicate_email',
            message: `A user with email "${email}" already exists.`,
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    const userId = authData.user.id;

    // Wait a bit for any database triggers to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if profile already exists (might be created by trigger)
    const { data: existingUserProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (!existingUserProfile) {
      // Create profile if it doesn't exist
      const { error: profileInsertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          email: email,
          full_name: fullName,
          role: 'client',
          is_active: true,
        });

      if (profileInsertError) {
        console.error('Profile insert error:', profileInsertError);
        throw profileInsertError;
      }
    } else {
      // Update existing profile
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({
          email: email,
          full_name: fullName,
          role: 'client',
          is_active: true,
        })
        .eq('user_id', userId);

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError);
        throw profileUpdateError;
      }
    }

    // Create client record
    const { error: clientError } = await supabaseAdmin.from('clients').insert({
      user_id: userId,
      company_name: companyName,
      contact_phone: contactPhone || null,
      street1: street1 || null,
      street2: street2 || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      welcome_email_sent: false,
    });

    if (clientError) {
      console.error('Client error:', clientError);
      throw clientError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: userId,
        email: email,
        companyName: companyName,
        message: 'Client invited successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error inviting client:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
