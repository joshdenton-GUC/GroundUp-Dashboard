-- =============================================================================
-- UPDATE USER ID GENERATION FOR PROFILES
-- =============================================================================
-- This migration updates the handle_new_user trigger to generate sequential
-- user IDs like "User_01", "User_02", etc. instead of using email as full_name.
-- =============================================================================

-- Update the handle_new_user function to generate sequential user IDs
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
  v_user_id TEXT;
  v_profile_count INTEGER;
BEGIN
  -- Get the current count of profiles to generate the next user ID
  SELECT COUNT(*) + 1 INTO v_profile_count FROM public.profiles;
  
  -- Generate the user ID in format "User_XX" where XX is zero-padded
  v_user_id := 'User_' || LPAD(v_profile_count::TEXT, 2, '0');

  -- Insert profile record with generated user ID
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email,
    v_user_id,
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
