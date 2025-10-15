-- Clean up clients table by removing unwanted columns
-- This migration removes columns that are not needed for the new signup process

-- Remove industry column
ALTER TABLE public.clients DROP COLUMN IF EXISTS industry;

-- Remove contact_email column (we'll use the user's email from profiles)
ALTER TABLE public.clients DROP COLUMN IF EXISTS contact_email;
