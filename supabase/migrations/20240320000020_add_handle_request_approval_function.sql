-- Create a function to handle request approval in a single transaction
CREATE OR REPLACE FUNCTION handle_request_approval(
    p_request_id UUID,
    p_book_id UUID,
    p_user_id UUID,
    p_borrower_email TEXT,
    p_institution_id UUID,
    p_loan_days INTEGER,
    p_fine_per_day DECIMAL(10,2)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update request status
    UPDATE requests
    SET status = 'approved'
    WHERE id = p_request_id
    AND institution_id = p_institution_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;

    -- Create borrowing record
    INSERT INTO borrowings (
        id,
        book_id,
        user_id,
        borrower_email,
        borrow_date,
        due_date,
        penalty,
        institution_id,
        fine_per_day
    ) VALUES (
        gen_random_uuid(),
        p_book_id,
        p_user_id,
        p_borrower_email,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP + (p_loan_days || ' days')::INTERVAL,
        0,
        p_institution_id,
        p_fine_per_day
    );

    -- No need to update book availability since it was already decreased when the request was created
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION handle_request_approval(UUID, UUID, UUID, TEXT, UUID, INTEGER, DECIMAL) TO authenticated;

-- Create a policy to allow librarians to execute the function
CREATE POLICY "Librarians can approve requests" ON books
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'librarian'
            AND profiles.institution_id = books.institution_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'librarian'
            AND profiles.institution_id = books.institution_id
        )
    ); 