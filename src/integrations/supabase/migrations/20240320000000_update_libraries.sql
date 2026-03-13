-- Create libraries table if it doesn't exist
CREATE TABLE IF NOT EXISTS libraries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    contact_number TEXT NOT NULL DEFAULT '',
    open_time TEXT NOT NULL DEFAULT '09:00',
    close_time TEXT NOT NULL DEFAULT '17:00',
    days_closed TEXT[] DEFAULT '{}',
    resources TEXT[] DEFAULT '{}',
    shelves JSONB DEFAULT '[]',
    user_types TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on libraries table
ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON libraries;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON libraries;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON libraries;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON libraries;

-- Add RLS policies for libraries table
CREATE POLICY "Enable read access for all users" ON libraries
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON libraries
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON libraries
FOR UPDATE USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON libraries
FOR DELETE USING (auth.role() = 'authenticated'); 