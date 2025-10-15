-- Ensure admins can select from public.clients via RLS
-- Safe to run multiple times; creates policy only if missing

DO $$
BEGIN
  -- make sure helper exists; if not, create minimal version
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'get_user_role' AND n.nspname = 'public'
  ) THEN
    CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
    RETURNS app_role
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
      SELECT role FROM public.profiles WHERE user_id = user_uuid;
    $fn$;
  END IF;

  -- Enable RLS on clients (no-op if already enabled)
  EXECUTE 'ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY';

  -- Create admin select policy if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'Admins can view all clients'
  ) THEN
    CREATE POLICY "Admins can view all clients" ON public.clients 
      FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
  END IF;

  -- Create self-view policy if missing (to avoid locking out clients)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'Clients can view their own data'
  ) THEN
    CREATE POLICY "Clients can view their own data" ON public.clients 
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;


