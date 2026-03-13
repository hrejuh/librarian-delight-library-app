-- Create institutions table if it doesn't exist
CREATE TABLE IF NOT EXISTS institutions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) NOT NULL UNIQUE,
    admin_password VARCHAR(255) NOT NULL DEFAULT 'changeme123',
    contact_phone VARCHAR(50),
    reserve_duration_days INTEGER NOT NULL DEFAULT 3,
    loan_duration_days INTEGER NOT NULL DEFAULT 7,
    late_fine_per_day DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    organization_structure JSONB NOT NULL DEFAULT '{
        "access_levels": {
            "SUPER_ADMIN": 1,
            "INSTITUTION_ADMIN": 2,
            "LIBRARY_MANAGER": 3,
            "USER": 4
        },
        "default_limits": {
            "SUPER_ADMIN": {"max_books": 10, "max_days": 30, "max_reservations": 5, "fine_per_day": 0, "concurrent_borrows": 10},
            "INSTITUTION_ADMIN": {"max_books": 8, "max_days": 21, "max_reservations": 4, "fine_per_day": 0, "concurrent_borrows": 8},
            "LIBRARY_MANAGER": {"max_books": 6, "max_days": 14, "max_reservations": 3, "fine_per_day": 0, "concurrent_borrows": 6},
            "USER": {"max_books": 3, "max_days": 7, "max_reservations": 2, "fine_per_day": 50, "concurrent_borrows": 3}
        }
    }'::jsonb,
    rules TEXT,
    open_time VARCHAR(5) DEFAULT '09:00',
    close_time VARCHAR(5) DEFAULT '16:00',
    off_days TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS institutions_name_idx ON institutions(name);
CREATE INDEX IF NOT EXISTS institutions_admin_email_idx ON institutions(admin_email);
CREATE INDEX IF NOT EXISTS institutions_created_by_idx ON institutions(created_by);
CREATE INDEX IF NOT EXISTS institutions_org_structure_idx ON institutions USING GIN (organization_structure);

-- Add RLS (Row Level Security) policies
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'institutions' AND policyname = 'Super admins can do everything with institutions') THEN
        DROP POLICY "Super admins can do everything with institutions" ON institutions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'institutions' AND policyname = 'Institution admins can manage their institution') THEN
        DROP POLICY "Institution admins can manage their institution" ON institutions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'institutions' AND policyname = 'Library managers can view their institution') THEN
        DROP POLICY "Library managers can view their institution" ON institutions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'institutions' AND policyname = 'Users can view their institution') THEN
        DROP POLICY "Users can view their institution" ON institutions;
    END IF;
END $$;

-- Policy for super admins (can do everything)
CREATE POLICY "Super admins can do everything with institutions"
    ON institutions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 1
        )
    );

-- Policy for institution admins (can manage their institution)
CREATE POLICY "Institution admins can manage their institution"
    ON institutions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 2
            AND profiles.institution_id = institutions.id
        )
    );

-- Policy for library managers (can view their institution)
CREATE POLICY "Library managers can view their institution"
    ON institutions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 3
            AND profiles.institution_id = institutions.id
        )
    );

-- Policy for users (can view their institution)
CREATE POLICY "Users can view their institution"
    ON institutions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 4
            AND profiles.institution_id = institutions.id
        )
    ); 