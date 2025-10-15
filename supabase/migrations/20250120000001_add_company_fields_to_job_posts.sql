-- Add company information fields to job_posts table
ALTER TABLE public.job_posts 
ADD COLUMN company_name TEXT,
ADD COLUMN company_address TEXT,
ADD COLUMN company_phone TEXT,
ADD COLUMN company_email TEXT,
ADD COLUMN company_website TEXT,
ADD COLUMN company_description TEXT;

-- Add indexes for company fields for better querying
CREATE INDEX idx_job_posts_company_name ON public.job_posts(company_name);
CREATE INDEX idx_job_posts_company_email ON public.job_posts(company_email);

-- Update existing job posts to populate company information from clients table
UPDATE public.job_posts 
SET 
  company_name = clients.company_name,
  company_address = clients.address,
  company_phone = clients.contact_phone,
  company_email = clients.contact_email,
  company_website = NULL,
  company_description = NULL
FROM public.clients 
WHERE job_posts.client_id = clients.id;

-- Make company_name required for new job posts (but not for existing ones)
ALTER TABLE public.job_posts 
ALTER COLUMN company_name SET NOT NULL;
