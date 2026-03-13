-- Update handle_request_approval function to include borrowing limit checks and maintain current functionality
CREATE OR REPLACE FUNCTION handle_request_approval(
    p_request_id uuid,
    p_book_id uuid,
    p_user_id uuid,
    p_borrower_email text,
    p_institution_id uuid,
    p_loan_days integer DEFAULT NULL,
    p_fine_per_day numeric DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_loan_days INTEGER;
    v_fine_per_day DECIMAL(10,2);
    v_max_books INTEGER;
    v_current_borrowed INTEGER;
BEGIN
    -- Get user's current borrowed books count and max books limit
    SELECT borrowed_books, 
           (organization_structure->'level4'->'configs'->0->>'max_books')::INTEGER
    INTO v_current_borrowed, v_max_books
    FROM profiles p
    JOIN institutions i ON p.institution_id = i.id
    WHERE p.id = p_user_id
    AND p.institution_id = p_institution_id;

    -- Check if user has reached their borrowing limit
    IF v_current_borrowed >= v_max_books THEN
        RAISE EXCEPTION 'User has reached their maximum borrowing limit of % books', v_max_books;
    END IF;

    -- Get institution settings if not provided
    IF p_loan_days IS NULL OR p_fine_per_day IS NULL THEN
        SELECT 
            COALESCE(p_loan_days, loan_duration_days) AS loan_duration_days,
            COALESCE(p_fine_per_day, late_fine_per_day) AS late_fine_per_day
        INTO v_loan_days, v_fine_per_day
        FROM institutions
        WHERE id = p_institution_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Institution settings not found';
        END IF;
    ELSE
        v_loan_days := p_loan_days;
        v_fine_per_day := p_fine_per_day;
    END IF;

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
        CURRENT_TIMESTAMP + (v_loan_days || ' days')::INTERVAL,
        0,
        p_institution_id,
        v_fine_per_day
    );

    -- Increment the borrowed_books count
    UPDATE profiles
    SET borrowed_books = borrowed_books + 1
    WHERE id = p_user_id
    AND institution_id = p_institution_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION handle_request_approval(UUID, UUID, UUID, TEXT, UUID, INTEGER, NUMERIC) TO authenticated; 