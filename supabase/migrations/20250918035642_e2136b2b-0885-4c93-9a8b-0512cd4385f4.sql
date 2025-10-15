-- Create admin profile for the current user (only if user exists)
DO $$
BEGIN
    -- Only insert if the user exists in auth.users and profile doesn't already exist
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = '60153c7d-1532-47fc-a672-cb46a92a30f2') 
       AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = '60153c7d-1532-47fc-a672-cb46a92a30f2') THEN
        INSERT INTO public.profiles (user_id, email, full_name, role)
        VALUES (
            '60153c7d-1532-47fc-a672-cb46a92a30f2',
            'jeffgus@gmail.com',
            'Jeff Gustafson',
            'admin'
        );
    END IF;
END $$;