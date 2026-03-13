-- Temporarily disable RLS
ALTER TABLE borrowings DISABLE ROW LEVEL SECURITY;

-- Ensure borrower_email column exists and has correct type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'borrowings' 
        AND column_name = 'borrower_email'
    ) THEN
        ALTER TABLE borrowings ADD COLUMN borrower_email text NOT NULL;
    ELSE
        -- If column exists, modify it to ensure correct type and constraints
        ALTER TABLE borrowings ALTER COLUMN borrower_email TYPE text;
        ALTER TABLE borrowings ALTER COLUMN borrower_email SET NOT NULL;
    END IF;
END $$;

-- Re-enable RLS
ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;

-- Comment the schema cache refresh since it requires superuser privileges
-- Instead, we'll use a dummy update to force schema refresh
UPDATE borrowings 
SET borrower_email = borrower_email 
WHERE false; 