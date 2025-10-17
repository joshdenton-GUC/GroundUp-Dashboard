-- Update function to get unopened emails for reminders to include position and location
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
  candidate_location TEXT,
  candidate_position TEXT,
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
    c.location as candidate_location,
    jp.title as candidate_position,
    en.sent_at
  FROM public.email_notifications en
  JOIN public.candidates c ON en.candidate_id = c.id
  LEFT JOIN public.job_posts jp ON c.job_post_id = jp.id
  WHERE en.email_type = 'initial'
    AND en.status = 'sent'
    AND en.opened_at IS NULL
    AND en.reminder_sent_at IS NULL
    AND en.sent_at < NOW() - INTERVAL '1 day'
  ORDER BY en.sent_at ASC;
$$;

