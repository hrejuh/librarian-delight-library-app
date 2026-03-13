-- Create a completely separate function using direct SQL
CREATE OR REPLACE FUNCTION direct_profile_lookup(lookup_id UUID)
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM profiles WHERE id = lookup_id;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION direct_profile_lookup(UUID) TO authenticated;

-- Add a trigger function to ensure proper roles are set
CREATE OR REPLACE FUNCTION ensure_proper_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is not set or invalid, set appropriate role
  IF NEW.role IS NULL OR NEW.role NOT IN ('student', 'librarian', 'admin', 'super_admin') THEN
    -- Special handling for admin emails
    IF NEW.email LIKE '%admin%' THEN
      NEW.role := 'super_admin';
    ELSE
      NEW.role := 'student';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enforce roles
DROP TRIGGER IF EXISTS ensure_proper_role_trigger ON profiles;
CREATE TRIGGER ensure_proper_role_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION ensure_proper_role(); 