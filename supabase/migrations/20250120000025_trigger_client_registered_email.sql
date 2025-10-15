-- =============================================================================
-- TRIGGER CLIENT REGISTERED EMAIL ALERT
-- =============================================================================
-- This migration creates a simple marker for new client signups
-- The actual email sending is handled by the frontend (AuthCallbackPage)
-- to avoid dependency on pg_net extension and ensure reliability
-- =============================================================================

-- Create a simple flag column to track if welcome email was sent
-- This is optional and just for tracking purposes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'welcome_email_sent'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN welcome_email_sent BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_clients_welcome_email_sent 
  ON public.clients(welcome_email_sent) 
  WHERE welcome_email_sent = false;

-- Add helpful comment
COMMENT ON COLUMN public.clients.welcome_email_sent IS 
  'Tracks whether the welcome/registration email alert has been sent to admins for this client';

