-- Function to query auth.users by email
CREATE OR REPLACE FUNCTION public.query_auth_user_by_email(user_email TEXT)
RETURNS json AS $$
DECLARE
  user_data json;
BEGIN
  SELECT json_build_object('id', id, 'email', email)
  INTO user_data
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
  
  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute SQL safely (limited to SELECT queries for security)
CREATE OR REPLACE FUNCTION public.execute_sql(sql TEXT)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Validate that this is a SELECT query for security
  IF NOT (sql ~* '^SELECT') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  EXECUTE sql INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 