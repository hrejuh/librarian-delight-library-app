-- Update books policies
DROP POLICY IF EXISTS "Librarians and admins can manage books" ON books;
DROP POLICY IF EXISTS "Librarians and admins can view books" ON books;
DROP POLICY IF EXISTS "Librarians and admins can delete books" ON books;

CREATE POLICY "Super admins can manage all books"
    ON books
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 1
        )
    );

CREATE POLICY "Institution admins can manage their books"
    ON books
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 2
            AND profiles.institution_id = books.institution_id
        )
    );

CREATE POLICY "Library managers can manage their books"
    ON books
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 3
            AND profiles.institution_id = books.institution_id
            AND profiles.library_id = books.library_id
        )
    );

CREATE POLICY "Users can view books"
    ON books
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 4
            AND profiles.institution_id = books.institution_id
        )
    );

-- Update borrowings policies
DROP POLICY IF EXISTS "Librarians and admins can manage borrowings" ON borrowings;
DROP POLICY IF EXISTS "Librarians and admins can view borrowings" ON borrowings;
DROP POLICY IF EXISTS "Students can view their borrowings" ON borrowings;

CREATE POLICY "Super admins can manage all borrowings"
    ON borrowings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 1
        )
    );

CREATE POLICY "Institution admins can manage their borrowings"
    ON borrowings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 2
            AND profiles.institution_id = borrowings.institution_id
        )
    );

CREATE POLICY "Library managers can manage their borrowings"
    ON borrowings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 3
            AND profiles.institution_id = borrowings.institution_id
            AND profiles.library_id = borrowings.library_id
        )
    );

CREATE POLICY "Users can view their borrowings"
    ON borrowings
    FOR SELECT
    TO authenticated
    USING (
        borrowings.user_id = auth.uid()
    );

-- Update authors and genres policies
DROP POLICY IF EXISTS "Librarians and admins can manage authors" ON authors;
DROP POLICY IF EXISTS "Librarians and admins can manage genres" ON genres;

CREATE POLICY "Super admins can manage all authors"
    ON authors
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 1
        )
    );

CREATE POLICY "Institution admins can manage their authors"
    ON authors
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 2
            AND profiles.institution_id = authors.institution_id
        )
    );

CREATE POLICY "Library managers can manage their authors"
    ON authors
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 3
            AND profiles.institution_id = authors.institution_id
            AND profiles.library_id = authors.library_id
        )
    );

CREATE POLICY "Super admins can manage all genres"
    ON genres
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 1
        )
    );

CREATE POLICY "Institution admins can manage their genres"
    ON genres
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 2
            AND profiles.institution_id = genres.institution_id
        )
    );

CREATE POLICY "Library managers can manage their genres"
    ON genres
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 3
            AND profiles.institution_id = genres.institution_id
            AND profiles.library_id = genres.library_id
        )
    );

-- Update book_borrow function
CREATE OR REPLACE FUNCTION book_borrow(
    p_book_id UUID,
    p_user_id UUID,
    p_institution_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has permission to borrow books
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = p_user_id
        AND access_level = 4
        AND institution_id = p_institution_id
    ) THEN
        RAISE EXCEPTION 'User does not have permission to borrow books';
    END IF;

    -- Rest of the function implementation...
END;
$$;

-- Update book_return function
CREATE OR REPLACE FUNCTION book_return(
    p_borrowing_id UUID,
    p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has permission to return books
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = p_user_id
        AND access_level IN (1, 2, 3)
    ) THEN
        RAISE EXCEPTION 'User does not have permission to return books';
    END IF;

    -- Rest of the function implementation...
END;
$$;

-- Update handle_request_approval function
CREATE OR REPLACE FUNCTION handle_request_approval(
    p_request_id UUID,
    p_approved BOOLEAN,
    p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has permission to handle requests
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = p_user_id
        AND access_level IN (1, 2, 3)
    ) THEN
        RAISE EXCEPTION 'User does not have permission to handle requests';
    END IF;

    -- Rest of the function implementation...
END;
$$; 