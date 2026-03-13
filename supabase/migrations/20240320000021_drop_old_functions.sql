-- Drop old functions that are no longer needed
DROP FUNCTION IF EXISTS approve_request_transaction(UUID, UUID, UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS increment_book_availability(UUID);

-- Note: We're keeping these functions as they're still used:
-- 1. borrow_book - Used when a student initially requests a book
-- 2. return_book - Used when a book is returned
-- 3. handle_request_approval - Our new consolidated function for approving requests 