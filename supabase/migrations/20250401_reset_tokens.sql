-- Create a table for password reset tokens
CREATE TABLE IF NOT EXISTS public.reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(email)
);

-- Add row-level security policies
ALTER TABLE public.reset_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to reset their own passwords
CREATE POLICY "Users can validate their own reset tokens" ON public.reset_tokens
  FOR SELECT
  USING (user_id = auth.uid());

-- Create functions to validate tokens
CREATE OR REPLACE FUNCTION public.validate_reset_token(p_email TEXT, p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_valid BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.reset_tokens
    WHERE email = p_email
    AND token = p_token
    AND expires_at > now()
    AND used = false
  ) INTO is_valid;
  
  RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark token as used
CREATE OR REPLACE FUNCTION public.use_reset_token(p_email TEXT, p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  token_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.reset_tokens
    WHERE email = p_email
    AND token = p_token
    AND expires_at > now()
    AND used = false
  ) INTO token_exists;
  
  IF token_exists THEN
    UPDATE public.reset_tokens
    SET used = true
    WHERE email = p_email
    AND token = p_token;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 