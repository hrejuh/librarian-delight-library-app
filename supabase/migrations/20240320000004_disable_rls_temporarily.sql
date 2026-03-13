-- Completely disable RLS on profiles table for now
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to prevent any issues
DROP POLICY IF EXISTS "Profiles access policy" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage institution profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON profiles;

-- Create a direct access function to bypass any potential recursive issues
CREATE OR REPLACE FUNCTION get_profile_by_id(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  institution_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.role::TEXT,
    p.institution_id,
    p.created_at
  FROM profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users on the function
GRANT EXECUTE ON FUNCTION get_profile_by_id(UUID) TO authenticated; 