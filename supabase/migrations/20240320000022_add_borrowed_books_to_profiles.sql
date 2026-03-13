-- Add borrowed_books column to profiles table
ALTER TABLE profiles
ADD COLUMN borrowed_books INTEGER DEFAULT 0;

-- Update the handle_request_approval function to check and update borrowed_books
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
    v_org_structure JSONB;
    v_user_role TEXT;
    v_max_books INTEGER;
    v_current_borrowed INTEGER;
BEGIN
    -- Get user's role and current borrowed books
    SELECT role, borrowed_books INTO v_user_role, v_current_borrowed
    FROM profiles
    WHERE id = p_user_id;

    -- Get institution's organization structure
    SELECT organization_structure INTO v_org_structure
    FROM institutions
    WHERE id = p_institution_id;

    -- Find user's max books limit from organization structure
    SELECT (config->>'max_books')::INTEGER INTO v_max_books
    FROM jsonb_array_elements(v_org_structure->'level4'->'configs') AS config
    WHERE config->>'name' ILIKE v_user_role;

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

    -- Increment user's borrowed_books count
    UPDATE profiles
    SET borrowed_books = borrowed_books + 1
    WHERE id = p_user_id;

    -- No need to update book availability since it was already decreased when the request was created
END;
$$ LANGUAGE plpgsql;

-- Also update the return_book function to decrement borrowed_books
CREATE OR REPLACE FUNCTION return_book(
    p_borrowing_id uuid,
    p_returner_id uuid,
    p_condition text,
    p_notes text
) RETURNS json AS $$
DECLARE
    v_user_id uuid;
    v_book_id uuid;
    v_return_date timestamp with time zone;
BEGIN
    -- Get the borrowing details
    SELECT user_id, book_id INTO v_user_id, v_book_id
    FROM borrowings
    WHERE id = p_borrowing_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Borrowing record not found';
    END IF;

    -- Update borrowing record
    UPDATE borrowings
    SET 
        return_date = CURRENT_TIMESTAMP,
        condition = p_condition,
        notes = p_notes,
        returned_by = p_returner_id
    WHERE id = p_borrowing_id;

    -- Decrement user's borrowed_books count
    UPDATE profiles
    SET borrowed_books = borrowed_books - 1
    WHERE id = v_user_id;

    -- Increment book availability
    UPDATE books
    SET available = available + 1
    WHERE id = v_book_id;

    RETURN json_build_object(
        'status', 'success',
        'message', 'Book returned successfully',
        'return_date', CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql; 