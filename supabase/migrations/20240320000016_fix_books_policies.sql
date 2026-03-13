-- Drop all existing policies on the books table
DROP POLICY IF EXISTS "Admins and librarians can insert books" ON books;
DROP POLICY IF EXISTS "Books are insertable by librarians" ON books;
DROP POLICY IF EXISTS "Books are viewable by institution members" ON books;
DROP POLICY IF EXISTS "Institution members can view books" ON books;
DROP POLICY IF EXISTS "Librarians can manage books in their institution" ON books;
DROP POLICY IF EXISTS "Librarians/Admins can manage books" ON books;
DROP POLICY IF EXISTS "Users can update book availability" ON books;
DROP POLICY IF EXISTS "Users can view books" ON books;
DROP POLICY IF EXISTS "books_insert_policy" ON books;
DROP POLICY IF EXISTS "books_select_policy" ON books;
DROP POLICY IF EXISTS "books_update_policy" ON books;

-- Create simplified policies
CREATE POLICY "books_select_policy" ON books
    FOR SELECT
    USING (true);

CREATE POLICY "books_insert_policy" ON books
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = ANY(ARRAY['librarian'::user_role, 'admin'::user_role, 'super_admin'::user_role])
            AND profiles.institution_id = books.institution_id
        )
    );

CREATE POLICY "books_update_policy" ON books
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = ANY(ARRAY['librarian'::user_role, 'admin'::user_role, 'super_admin'::user_role])
            AND profiles.institution_id = books.institution_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = ANY(ARRAY['librarian'::user_role, 'admin'::user_role, 'super_admin'::user_role])
            AND profiles.institution_id = books.institution_id
        )
    );

-- Ensure RLS is enabled
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON books TO authenticated;
GRANT INSERT, UPDATE, DELETE ON books TO authenticated;
GRANT ALL ON books TO service_role; 