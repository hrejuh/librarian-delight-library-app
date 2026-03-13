-- Permanently disable RLS on profiles to stop infinite recursion errors
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage institution profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles access policy" ON profiles; 