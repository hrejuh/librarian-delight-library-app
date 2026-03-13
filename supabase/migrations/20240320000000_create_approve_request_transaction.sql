-- Create a stored procedure to handle request approval in a transaction
CREATE OR REPLACE FUNCTION approve_request_transaction(
  p_request_id UUID,
  p_book_id UUID,
  p_user_id UUID,
  p_borrower_email TEXT,
  p_institution_id UUID
) RETURNS void AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Update request status
    UPDATE requests
    SET status = 'approved'
    WHERE id = p_request_id;

    -- Create borrowing record
    INSERT INTO borrowings (
      id,
      book_id,
      user_id,
      borrower_email,
      borrow_date,
      due_date,
      penalty,
      institution_id
    ) VALUES (
      gen_random_uuid(),
      p_book_id,
      p_user_id,
      p_borrower_email,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP + INTERVAL '7 days',
      0,
      p_institution_id
    );

    -- Commit transaction
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction on error
      ROLLBACK;
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql; 