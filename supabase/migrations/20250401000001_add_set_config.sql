-- Create a public wrapper for the set_config function
CREATE OR REPLACE FUNCTION public.set_config(parameter text, value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pg_catalog.set_config(parameter, value, false);
END;
$$;

-- Make the function accessible to all users
GRANT EXECUTE ON FUNCTION public.set_config(text, text) TO public;

-- Add a comment to explain the function
COMMENT ON FUNCTION public.set_config(text, text) IS 'A wrapper for pg_catalog.set_config that allows setting session parameters from client code'; 