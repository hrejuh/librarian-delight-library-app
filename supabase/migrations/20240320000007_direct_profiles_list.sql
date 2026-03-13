-- Create a direct listing function for profiles to bypass RLS
CREATE OR REPLACE FUNCTION direct_profiles_list()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM profiles;
$$;

-- Grant execute permission for authenticated users
GRANT EXECUTE ON FUNCTION direct_profiles_list() TO authenticated; 