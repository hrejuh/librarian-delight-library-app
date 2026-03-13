-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to update expired requests
CREATE OR REPLACE FUNCTION update_expired_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE requests
  SET 
    status = 'expired',
    notes = 'Request expired - not collected within 3 days'
  WHERE 
    status = 'pending' 
    AND expiration_date <= NOW();
END;
$$;

-- Create a cron job to run the function every hour
SELECT cron.schedule(
  'update-expired-requests',
  '0 * * * *',  -- Run every hour
  $$
  SELECT update_expired_requests();
  $$
); 