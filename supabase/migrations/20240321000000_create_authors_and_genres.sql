-- Create authors table
CREATE TABLE IF NOT EXISTS authors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- Create policies for authors
CREATE POLICY "Authors are viewable by all" ON authors
    FOR SELECT
    USING (true);

CREATE POLICY "Authors are insertable by librarians" ON authors
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = ANY(ARRAY['librarian'::user_role, 'admin'::user_role, 'super_admin'::user_role])
        )
    );

-- Create policies for genres
CREATE POLICY "Genres are viewable by all" ON genres
    FOR SELECT
    USING (true);

CREATE POLICY "Genres are insertable by librarians" ON genres
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = ANY(ARRAY['librarian'::user_role, 'admin'::user_role, 'super_admin'::user_role])
        )
    );

-- Grant permissions
GRANT SELECT ON authors TO authenticated;
GRANT INSERT ON authors TO authenticated;
GRANT SELECT ON genres TO authenticated;
GRANT INSERT ON genres TO authenticated; 