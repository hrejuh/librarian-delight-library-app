-- Add status and notes columns to requests table
ALTER TABLE requests
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending',
ADD COLUMN notes TEXT;

-- Update existing requests to have a status
UPDATE requests
SET status = CASE
  WHEN expiration_date < NOW() THEN 'expired'
  ELSE 'pending'
END; 