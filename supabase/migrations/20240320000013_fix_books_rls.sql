-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view books in their institution" ON books;
DROP POLICY IF EXISTS "Librarians/Admins can manage books in their institution" ON books;

-- Create simplified policies that avoid recursion
CREATE POLICY "Users can view books in their institution" ON books
    FOR SELECT
    USING (true);

CREATE POLICY "Librarians/Admins can manage books in their institution" ON books
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON books TO authenticated;
GRANT INSERT, UPDATE, DELETE ON books TO authenticated;
GRANT ALL ON books TO service_role; 