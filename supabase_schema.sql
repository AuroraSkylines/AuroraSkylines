-- ==========================================
-- Aurora Skylines - Private Alpha Setup
-- Run this entire script in the Supabase SQL Editor
-- ==========================================

-- 1. Create Invite Keys Table
CREATE TABLE public.invite_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  used boolean DEFAULT false NOT NULL,
  used_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Protect invite_keys from client access entirely
ALTER TABLE public.invite_keys ENABLE ROW LEVEL SECURITY;

-- 2. Create Game Saves Table
CREATE TABLE public.game_saves (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  save_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own save
CREATE POLICY "Users can view own save"
  ON public.game_saves FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own save
CREATE POLICY "Users can insert own save"
  ON public.game_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own save
CREATE POLICY "Users can update own save"
  ON public.game_saves FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Invite Key Validation Trigger (Security Definer)
CREATE OR REPLACE FUNCTION public.check_invite_key_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Required to bypass RLS and access invite_keys from auth context
AS $$
DECLARE
  key_record RECORD;
  provided_key TEXT;
BEGIN
  provided_key := NEW.raw_user_meta_data->>'invite_key';

  -- Find the invite key and lock the row
  SELECT * INTO key_record 
  FROM public.invite_keys 
  WHERE key = provided_key AND used = false 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already used invite key.';
  END IF;

  -- Mark key as used
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

-- 4. Seed Initial 5 Invite Keys
INSERT INTO public.invite_keys (key) VALUES
  ('CHILL-ALPHA-0001'),
  ('CHILL-ALPHA-0002'),
  ('COZY-TOWN-0003'),
  ('COZY-TOWN-0004'),
  ('AURORA-TEST-0005')
ON CONFLICT (key) DO NOTHING;
