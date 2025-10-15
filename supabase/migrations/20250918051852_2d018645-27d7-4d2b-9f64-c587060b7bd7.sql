-- Make the resumes bucket public so PDFs can be accessed via public URLs
UPDATE storage.buckets SET public = true WHERE id = 'resumes';

-- Add RLS policies for the resumes bucket
CREATE POLICY "Resumes are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can upload resumes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'resumes' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update their own resumes" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'resumes' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete their own resumes" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'resumes' 
  AND auth.role() = 'authenticated'
);