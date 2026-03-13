-- Create a function to handle book borrowing
CREATE OR REPLACE FUNCTION borrow_book(
    p_book_id UUID,
    p_user_id UUID,
    p_institution_id UUID,
    p_expiration_date TIMESTAMP WITH TIME ZONE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request_id UUID;
    v_book_total INTEGER;
    v_book_available INTEGER;
BEGIN
    -- Check if the book exists and is available
    SELECT total, available INTO v_book_total, v_book_available
    FROM books
    WHERE id = p_book_id
    AND institution_id = p_institution_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Book not found';
    END IF;

    IF v_book_available <= 0 THEN
        RAISE EXCEPTION 'Book is not available for borrowing';
    END IF;

    -- Update book total and available
    UPDATE books
    SET total = total - 1,
        available = available - 1
    WHERE id = p_book_id
    AND institution_id = p_institution_id;

    -- Create borrow request
    INSERT INTO requests (
        book_id,
        user_id,
        institution_id,
        request_date,
        expiration_date,
        status,
        notes
    )
    VALUES (
        p_book_id,
        p_user_id,
        p_institution_id,
        CURRENT_TIMESTAMP,
        p_expiration_date,
        'pending',
        'Collect within ' || EXTRACT(DAY FROM (p_expiration_date - CURRENT_TIMESTAMP)) || ' days'
    )
    RETURNING id INTO v_request_id;

    RETURN v_request_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION borrow_book(UUID, UUID, UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Create a policy to allow students to execute the function
CREATE POLICY "Students can borrow books" ON books
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'student'
            AND profiles.institution_id = books.institution_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'student'
            AND profiles.institution_id = books.institution_id
        )
    ); 