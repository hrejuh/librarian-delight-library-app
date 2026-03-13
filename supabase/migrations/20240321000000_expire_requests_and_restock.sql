-- Create a function to expire pending requests and restock books
CREATE OR REPLACE FUNCTION expire_pending_requests_and_restock()
RETURNS void AS $$
DECLARE
  expired_request RECORD;
BEGIN
  FOR expired_request IN
    SELECT id, book_id
    FROM requests
    WHERE status = 'pending'
      AND expiration_date < NOW()
  LOOP
    -- Mark request as expired
    UPDATE requests
    SET status = 'expired'
    WHERE id = expired_request.id;

    -- Increment book stock
    UPDATE books
    SET available = available + 1
    WHERE id = expired_request.book_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run daily at 1am using pg_cron
SELECT cron.schedule('Expire Requests Daily', '0 1 * * *', $$SELECT expire_pending_requests_and_restock();$$); 