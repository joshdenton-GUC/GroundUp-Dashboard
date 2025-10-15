-- =============================================================================
-- CREATE CLIENT RECORD ON SIGNUP
-- =============================================================================
-- This migration updates the handle_new_user trigger to create both profile
-- and client records at the same time during signup.
-- This eliminates race conditions and simplifies the signup flow.
-- =============================================================================

-- Add unique constraint to prevent duplicate client records (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'clients_user_id_unique'
    ) THEN
        ALTER TABLE public.clients 
        ADD CONSTRAINT clients_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- Update the handle_new_user function to create both profile AND client records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_name TEXT;
  v_contact_phone TEXT;
  v_address TEXT;
BEGIN
  -- Insert profile record
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email),
    'client'
  );

  -- Extract company information from user metadata
  v_company_name := NEW.raw_user_meta_data ->> 'company_name';
  v_contact_phone := NEW.raw_user_meta_data ->> 'contact_phone';
  v_address := NEW.raw_user_meta_data ->> 'address';

  -- Create client record if company name is provided
  IF v_company_name IS NOT NULL AND v_company_name != '' THEN
    INSERT INTO public.clients (user_id, company_name, contact_phone, address)
    VALUES (
      NEW.id,
      v_company_name,
      v_contact_phone,
      v_address
    )
    ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicates
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

