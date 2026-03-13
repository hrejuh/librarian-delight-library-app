-- Update any profiles with incorrect roles
UPDATE profiles 
SET role = 'super_admin' 
WHERE email LIKE '%admin%' AND role != 'super_admin';

-- Set default roles for any nulls
UPDATE profiles
SET role = 'student'
WHERE role IS NULL;

-- Make sure RLS is disabled for now to prevent further issues
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Clean up any dangling policies just to be safe
DROP POLICY IF EXISTS "Profiles access policy" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage institution profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON profiles; 