-- Fix RLS policies for email_alerts table
-- This migration ensures admins can manage email alerts properly

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Drop old policies
  DROP POLICY IF EXISTS "Admins can manage email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can view email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can insert email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can update email alerts" ON public.email_alerts;
  DROP POLICY IF EXISTS "Admins can delete email alerts" ON public.email_alerts;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.email_alerts ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for admins
CREATE POLICY "Admins can select email alerts"
ON public.email_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'::public.app_role
  )
);

CREATE POLICY "Admins can insert email alerts"
ON public.email_alerts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'::public.app_role
  )
);

CREATE POLICY "Admins can update email alerts"
ON public.email_alerts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'::public.app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'::public.app_role
  )
);

CREATE POLICY "Admins can delete email alerts"
ON public.email_alerts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'::public.app_role
  )
);

