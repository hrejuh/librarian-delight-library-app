-- Library Management System Functions

-- Function to handle book borrowing
CREATE OR REPLACE FUNCTION public.borrow_book(
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
    v_book_available INTEGER;
BEGIN
    -- Check if the book exists and is available
    SELECT available INTO v_book_available
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

    -- Update only the available count
    UPDATE books
    SET available = available - 1
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

-- Function to handle request approval in a single transaction
CREATE OR REPLACE FUNCTION public.handle_request_approval(
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

-- Function to handle book returns
CREATE OR REPLACE FUNCTION public.return_book(
    p_borrowing_id UUID,
    p_institution_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_book_id UUID;
    v_penalty DECIMAL(10,2);
    v_due_date TIMESTAMP WITH TIME ZONE;
    v_return_date TIMESTAMP WITH TIME ZONE;
    v_late_fine_per_day DECIMAL(10,2);
BEGIN
    -- Get the borrowing details and lock the row
    SELECT book_id, due_date, return_date
    INTO v_book_id, v_due_date, v_return_date
    FROM borrowings
    WHERE id = p_borrowing_id
    AND institution_id = p_institution_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borrowing record not found';
    END IF;

    IF v_return_date IS NOT NULL THEN
        RAISE EXCEPTION 'Book has already been returned';
    END IF;

    -- Get the institution's late fine rate
    SELECT late_fine_per_day INTO v_late_fine_per_day
    FROM institutions
    WHERE id = p_institution_id;

    -- Calculate penalty if returned late
    v_return_date := CURRENT_TIMESTAMP;
    IF v_return_date > v_due_date THEN
        v_penalty := EXTRACT(DAY FROM (v_return_date - v_due_date)) * v_late_fine_per_day;
    ELSE
        v_penalty := 0;
    END IF;

    -- Update the borrowing record
    UPDATE borrowings
    SET return_date = v_return_date,
        penalty = v_penalty
    WHERE id = p_borrowing_id;

    -- Increment only the available count
    UPDATE books
    SET available = available + 1
    WHERE id = v_book_id
    AND institution_id = p_institution_id;

    -- If there was a penalty, create a notification or handle it as needed
    IF v_penalty > 0 THEN
        RAISE NOTICE 'Late return penalty: %', v_penalty;
    END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.borrow_book(UUID, UUID, UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_request_approval(UUID, UUID, UUID, TEXT, UUID, INTEGER, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.return_book(UUID, UUID) TO authenticated;

-- Create policies
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

CREATE POLICY "Librarians can approve requests" ON books
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('librarian', 'admin', 'super_admin')
            AND profiles.institution_id = books.institution_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('librarian', 'admin', 'super_admin')
            AND profiles.institution_id = books.institution_id
        )
    ); 