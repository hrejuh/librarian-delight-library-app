-- Update profiles table for tiered access
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS access_level INTEGER NOT NULL DEFAULT 4 CHECK (access_level BETWEEN 1 AND 4),
    ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id),
    ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- Create index for access level queries
CREATE INDEX IF NOT EXISTS profiles_access_level_idx ON profiles(access_level);
CREATE INDEX IF NOT EXISTS profiles_role_id_idx ON profiles(role_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Librarians can view all profiles" ON profiles;

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 1
        )
    );

-- Institution admins can view profiles in their institution
CREATE POLICY "Institution admins can view institution profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 2
            AND profiles.institution_id = profiles.institution_id
        )
    );

-- Library managers can view profiles in their library
CREATE POLICY "Library managers can view library profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 3
            AND profiles.institution_id = profiles.institution_id
            AND profiles.library_id = profiles.library_id
        )
    );

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        profiles.id = auth.uid()
    );

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
WHERE role IN ('student', 'faculty', 'patron', 'guest'); 