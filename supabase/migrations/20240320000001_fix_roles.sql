-- First, let's check the current profiles
SELECT id, email, role, institution_id FROM profiles;

-- Create a function to ensure proper role assignment
CREATE OR REPLACE FUNCTION ensure_proper_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is not set, default to student
    IF NEW.role IS NULL THEN
        NEW.role := 'student';
    END IF;
    
    -- Ensure role is one of the valid values
    IF NEW.role NOT IN ('student', 'librarian', 'admin', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role: %', NEW.role;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to ensure proper role assignment
DROP TRIGGER IF EXISTS ensure_proper_role_trigger ON profiles;
CREATE TRIGGER ensure_proper_role_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION ensure_proper_role();

-- Update RLS policies to ensure proper role access
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage institution profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON profiles;

-- Recreate policies with proper role checks
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage institution profiles" ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
            AND institution_id = profiles.institution_id
        )
    );

CREATE POLICY "Super admins can manage all profiles" ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );

CREATE POLICY "Authenticated users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id); 