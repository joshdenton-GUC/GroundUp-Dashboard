-- Create email notifications tracking table
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('initial', 'reminder')),
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'failed', 'reminder_sent')),
  resend_email_id TEXT, -- Resend email ID for webhook tracking
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email notifications
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_notifications_candidate_client ON public.email_notifications(candidate_id, client_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient ON public.email_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON public.email_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_resend_id ON public.email_notifications(resend_email_id);

-- RLS Policies for email notifications
DO $$
BEGIN
    -- Admins can view all email notifications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_notifications' AND policyname = 'Admins can view all email notifications') THEN
        CREATE POLICY "Admins can view all email notifications" ON public.email_notifications FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
    END IF;
    
    -- Clients can view their own email notifications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_notifications' AND policyname = 'Clients can view their email notifications') THEN
        CREATE POLICY "Clients can view their email notifications" ON public.email_notifications FOR SELECT USING (
            client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
        );
    END IF;
    
    -- Allow system to insert email notifications (for tracking)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_notifications' AND policyname = 'System can insert email notifications') THEN
        CREATE POLICY "System can insert email notifications" ON public.email_notifications FOR INSERT WITH CHECK (true);
    END IF;
    
    -- Allow system to update email notifications (for tracking opens/clicks)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_notifications' AND policyname = 'System can update email notifications') THEN
        CREATE POLICY "System can update email notifications" ON public.email_notifications FOR UPDATE USING (true);
    END IF;
END $$;

-- Add update trigger for email notifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_notifications_updated_at') THEN
        CREATE TRIGGER update_email_notifications_updated_at 
        BEFORE UPDATE ON public.email_notifications 
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Create function to get unopened emails for reminders
CREATE OR REPLACE FUNCTION public.get_unopened_emails_for_reminder()
RETURNS TABLE (
  id UUID,
  candidate_id UUID,
  client_id UUID,
  recipient_email TEXT,
  candidate_name TEXT,
  candidate_email TEXT,
  candidate_skills TEXT[],
  candidate_summary TEXT,
  sent_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    en.id,
    en.candidate_id,
    en.client_id,
    en.recipient_email,
    c.full_name as candidate_name,
    c.email as candidate_email,
    c.skills as candidate_skills,
    c.summary as candidate_summary,
    en.sent_at
  FROM public.email_notifications en
  JOIN public.candidates c ON en.candidate_id = c.id
  WHERE en.email_type = 'initial'
    AND en.status = 'sent'
    AND en.opened_at IS NULL
    AND en.reminder_sent_at IS NULL
    AND en.sent_at < NOW() - INTERVAL '1 day'
  ORDER BY en.sent_at ASC;
$$;

-- Create function to mark reminder as sent
CREATE OR REPLACE FUNCTION public.mark_reminder_sent(notification_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.email_notifications 
  SET reminder_sent_at = NOW(), 
      status = 'reminder_sent',
      updated_at = NOW()
  WHERE id = notification_id;
$$;

-- Create function to check for unopened emails and trigger reminders
CREATE OR REPLACE FUNCTION public.check_and_trigger_reminders()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unopened_count INTEGER;
BEGIN
  -- Count unopened emails older than 24 hours
  SELECT COUNT(*) INTO unopened_count
  FROM public.email_notifications
  WHERE email_type = 'initial'
    AND status = 'sent'
    AND opened_at IS NULL
    AND reminder_sent_at IS NULL
    AND sent_at < NOW() - INTERVAL '24 hours';

  -- If there are unopened emails, log it (the actual reminder sending will be handled by scheduled jobs)
  IF unopened_count > 0 THEN
    RAISE NOTICE 'Found % unopened emails that may need reminders', unopened_count;
  END IF;
END;
$$;

-- Create a trigger function that checks for reminders when email status changes
CREATE OR REPLACE FUNCTION public.trigger_reminder_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only check if this is an initial email that was just sent
  IF NEW.email_type = 'initial' AND NEW.status = 'sent' AND OLD.status IS DISTINCT FROM 'sent' THEN
    -- Schedule a check for reminders in 24 hours
    -- This is a placeholder - in production, you'd use a job scheduler
    PERFORM public.check_and_trigger_reminders();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for email status changes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_reminder_check_on_email_update') THEN
        CREATE TRIGGER trigger_reminder_check_on_email_update
        AFTER UPDATE ON public.email_notifications
        FOR EACH ROW
        EXECUTE FUNCTION public.trigger_reminder_check();
    END IF;
END $$;
