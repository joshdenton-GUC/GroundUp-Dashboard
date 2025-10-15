-- Update current user to admin (will need to run manual update after getting user ID)
-- Create admin emails table for managing admin access
CREATE TABLE public.admin_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for admin emails
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Create email alerts configuration table
CREATE TABLE public.email_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'candidate_assigned', 'new_resume_uploaded', etc.
  recipient_email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for email alerts
ALTER TABLE public.email_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin emails
CREATE POLICY "Admins can manage admin emails" 
ON public.admin_emails 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- RLS policies for email alerts
CREATE POLICY "Admins can manage email alerts" 
ON public.email_alerts 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

-- Add triggers for updated_at
CREATE TRIGGER update_admin_emails_updated_at
BEFORE UPDATE ON public.admin_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_alerts_updated_at
BEFORE UPDATE ON public.email_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();