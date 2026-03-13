-- Add access_level column to profiles table
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS access_level INTEGER NOT NULL DEFAULT 4 CHECK (access_level BETWEEN 1 AND 4);

-- Create index for access level queries
CREATE INDEX IF NOT EXISTS profiles_access_level_idx ON profiles(access_level);

-- Update existing profiles to have appropriate access levels
UPDATE profiles
SET access_level = 1
WHERE role = 'super_admin';

UPDATE profiles
SET access_level = 2
WHERE role = 'admin';

UPDATE profiles
SET access_level = 3
WHERE role = 'librarian';

UPDATE profiles
SET access_level = 4
WHERE role = 'student';

-- Create a function to get user's access level without RLS
CREATE OR REPLACE FUNCTION get_user_access_level()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (SELECT access_level FROM profiles WHERE id = auth.uid());
END;
$$;

-- Create a function to get user's institution without RLS
CREATE OR REPLACE FUNCTION get_user_institution()
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (SELECT institution_id FROM profiles WHERE id = auth.uid());
END;
$$;

-- Drop ALL existing policies for profiles table
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Institution admins can view institution profiles" ON profiles;
DROP POLICY IF EXISTS "Library managers can view library profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Librarians can view all profiles" ON profiles;

-- Create new RLS policies based on access levels
CREATE POLICY "Super admins can view all profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        get_user_access_level() = 1
    );

CREATE POLICY "Institution admins can view institution profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        get_user_access_level() = 2
        AND institution_id = get_user_institution()
    );

CREATE POLICY "Library managers can view library profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        get_user_access_level() = 3
        AND institution_id = get_user_institution()
    );

CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
    ); 