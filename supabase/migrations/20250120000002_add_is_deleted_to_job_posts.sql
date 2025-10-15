-- Add isDeleted column to job_posts table for soft delete functionality
ALTER TABLE public.job_posts 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Create index for efficient querying of non-deleted records
CREATE INDEX idx_job_posts_is_deleted ON public.job_posts(is_deleted);

-- Update existing records to ensure they are not marked as deleted
UPDATE public.job_posts SET is_deleted = false WHERE is_deleted IS NULL;

-- Add comment to document the soft delete functionality
COMMENT ON COLUMN public.job_posts.is_deleted IS 'Soft delete flag - true means the job post is deleted, false means it is active';
