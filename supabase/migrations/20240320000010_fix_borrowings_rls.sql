-- Drop existing policies
DROP POLICY IF EXISTS "Users can view borrowings in their institution" ON borrowings;
DROP POLICY IF EXISTS "Librarians/Super Admins can manage borrowings in their institution" ON borrowings;

-- Create new policies
-- Allow users to view borrowings in their institution
CREATE POLICY "Users can view borrowings in their institution" ON borrowings
    FOR SELECT
    USING (
        institution_id IN (
            SELECT institution_id 
            FROM profiles 
            WHERE id = auth.uid()
        )
    );

-- Allow librarians and admins to manage borrowings in their institution
CREATE POLICY "Librarians/Admins can manage borrowings in their institution" ON borrowings
    FOR ALL
    USING (
        institution_id IN (
            SELECT institution_id 
            FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('librarian', 'admin')
        )
    )
    WITH CHECK (
        institution_id IN (
            SELECT institution_id 
            FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('librarian', 'admin')
        )
    );

-- Grant necessary permissions
GRANT SELECT ON borrowings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON borrowings TO authenticated;
GRANT ALL ON borrowings TO service_role; 