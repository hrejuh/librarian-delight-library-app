-- Create a function to handle book returns
CREATE OR REPLACE FUNCTION return_book(
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

    -- Increment the book's total and available
    UPDATE books
    SET total = total + 1,
        available = available + 1
    WHERE id = v_book_id
    AND institution_id = p_institution_id;

    -- If there was a penalty, create a notification or handle it as needed
    IF v_penalty > 0 THEN
        -- You might want to create a notification or handle the penalty in some way
        -- For now, we'll just log it
        RAISE NOTICE 'Late return penalty: %', v_penalty;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION return_book(UUID, UUID) TO authenticated;

-- Create a policy to allow librarians to execute the function
CREATE POLICY "Librarians can return books" ON books
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