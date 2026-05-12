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

-- 2. Invite Key Validation Trigger (Security Definer)
-- This runs BEFORE a user is created in auth.users
CREATE OR REPLACE FUNCTION public.check_invite_key_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Required to bypass RLS and access invite_keys from auth context
AS $$
DECLARE
  key_record RECORD;
  provided_key TEXT;
BEGIN
  -- Extract the invite key from the signup metadata
  provided_key := NEW.raw_user_meta_data->>'invite_key';

  -- If no key provided, reject
  IF provided_key IS NULL OR provided_key = '' THEN
    RAISE EXCEPTION 'An invite key is required to register.';
  END IF;

  -- Find the invite key and lock the row
  SELECT * INTO key_record 
  FROM public.invite_keys 
  WHERE key = provided_key AND used = false 
  FOR UPDATE;

  -- If key doesn't exist or is used, reject
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already used invite key.';
  END IF;

  -- Mark key as used and attach it to the new user ID
  UPDATE public.invite_keys 
  SET used = true, used_by_user_id = NEW.id 
  WHERE id = key_record.id;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS ensure_valid_invite_key ON auth.users;
CREATE TRIGGER ensure_valid_invite_key
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_invite_key_on_signup();

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
