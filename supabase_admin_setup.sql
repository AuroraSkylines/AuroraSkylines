-- ==========================================
-- Aurora Skylines - Alpha Keys & Admin Panel Setup
-- Run this entire script in the Supabase SQL Editor
-- ==========================================

-- 1. Create Invite Keys Table (Safely)
CREATE TABLE IF NOT EXISTS public.invite_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  used boolean DEFAULT false NOT NULL,
  used_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Protect invite_keys from unauthorized client access
ALTER TABLE public.invite_keys ENABLE ROW LEVEL SECURITY;

-- Allow read access ONLY if the user is an admin
DROP POLICY IF EXISTS "Admins can view invite keys" ON public.invite_keys;
CREATE POLICY "Admins can view invite keys"
  ON public.invite_keys FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'username' = 'admin'
    )
  );

-- 2. Drop the buggy auth trigger (if it exists)
DROP TRIGGER IF EXISTS ensure_valid_invite_key ON auth.users;
DROP FUNCTION IF EXISTS public.check_invite_key_on_signup() CASCADE;

-- 3. RPC: Validate Invite Key (Client-side check BEFORE signup)
CREATE OR REPLACE FUNCTION public.is_key_valid(invite_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.invite_keys 
    WHERE key = invite_key AND used = false
  );
END;
$$;

-- 4. RPC: Consume Invite Key (Client-side check AFTER signup)
CREATE OR REPLACE FUNCTION public.consume_key(invite_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We rely on the fact that only authenticated users can call this successfully
  -- and it marks the key as used by them.
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.invite_keys 
  SET used = true, used_by_user_id = auth.uid()
  WHERE key = invite_key AND used = false;
END;
$$;

-- 3. Admin RPC: Generate New Invite Key
CREATE OR REPLACE FUNCTION public.generate_invite_key(prefix text DEFAULT 'ALPHA-')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_key text;
  caller_username text;
BEGIN
  -- Verify caller is admin
  SELECT raw_user_meta_data->>'username' INTO caller_username
  FROM auth.users WHERE id = auth.uid();
  
  IF caller_username != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can generate keys.';
  END IF;

  -- Generate a random 6-character alphanumeric string
  new_key := prefix || substring(md5(random()::text), 1, 6);
  
  -- Insert into table
  INSERT INTO public.invite_keys (key) VALUES (UPPER(new_key));
  
  RETURN UPPER(new_key);
END;
$$;

-- 4. Seed Initial Keys (if empty)
INSERT INTO public.invite_keys (key) VALUES
  ('CHILL-ALPHA-0001'),
  ('CHILL-ALPHA-0002'),
  ('COZY-TOWN-0003'),
  ('COZY-TOWN-0004'),
  ('AURORA-TEST-0005')
ON CONFLICT (key) DO NOTHING;
