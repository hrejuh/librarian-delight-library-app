-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage institution profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON profiles;

-- Create policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Authenticated users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow service role to bypass RLS for profile creation
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON profiles TO authenticated;
GRANT INSERT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role; 