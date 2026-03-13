-- Fix handle_request_approval function with complete implementation
CREATE OR REPLACE FUNCTION public.handle_request_approval(
    p_request_id uuid,
    p_book_id uuid,
    p_user_id uuid,
    p_borrower_email text,
    p_institution_id uuid,
    p_loan_days integer DEFAULT NULL,
    p_fine_per_day numeric DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    WHERE id = p_user_id
    AND institution_id = p_institution_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Get institution's organization structure
    SELECT organization_structure INTO v_org_structure
    FROM institutions
    WHERE id = p_institution_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Institution not found';
    END IF;

    -- Find user's max books limit from organization structure
    SELECT (config->>'max_books')::INTEGER INTO v_max_books
    FROM jsonb_array_elements(v_org_structure->'level4'->'configs') AS config
    WHERE config->>'name' ILIKE v_user_role;

    IF v_max_books IS NULL THEN
        RAISE EXCEPTION 'No borrowing limit configuration found for role: %', v_user_role;
    END IF;

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
$$;

-- Drop existing grants if any
REVOKE ALL ON FUNCTION public.handle_request_approval(UUID, UUID, UUID, TEXT, UUID, INTEGER, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_request_approval(UUID, UUID, UUID, TEXT, UUID, INTEGER, NUMERIC) FROM authenticated;
REVOKE ALL ON FUNCTION public.handle_request_approval(UUID, UUID, UUID, TEXT, UUID, INTEGER, NUMERIC) FROM anon;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_request_approval(UUID, UUID, UUID, TEXT, UUID, INTEGER, NUMERIC) TO authenticated;

-- Enable RLS
ALTER FUNCTION public.handle_request_approval(UUID, UUID, UUID, TEXT, UUID, INTEGER, NUMERIC) SET search_path = public;

-- Create policy to allow authenticated users to execute the function
CREATE POLICY "Allow authenticated users to execute handle_request_approval"
ON public.requests
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('librarian', 'admin', 'super_admin')
        AND profiles.institution_id = requests.institution_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('librarian', 'admin', 'super_admin')
        AND profiles.institution_id = requests.institution_id
    )
); 