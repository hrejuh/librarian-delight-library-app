-- Create a function to increment book availability
CREATE OR REPLACE FUNCTION increment_book_availability(book_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE books
  SET available = available + 1
  WHERE id = book_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_book_availability(UUID) TO authenticated; 