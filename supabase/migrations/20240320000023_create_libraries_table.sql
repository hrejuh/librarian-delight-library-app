-- Drop existing tables if they exist
DROP TABLE IF EXISTS library_access;
DROP TABLE IF EXISTS libraries;

-- Create libraries table
CREATE TABLE libraries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    contact_info JSONB,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_default BOOLEAN DEFAULT false
);

-- Create library_access table for level 3 users
CREATE TABLE library_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    UNIQUE(library_id, profile_id)
);

-- Add indexes
CREATE INDEX libraries_institution_id_idx ON libraries(institution_id);
CREATE INDEX libraries_created_by_idx ON libraries(created_by);
CREATE INDEX library_access_library_id_idx ON library_access(library_id);
CREATE INDEX library_access_profile_id_idx ON library_access(profile_id);

-- Enable RLS
ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for libraries
CREATE POLICY "Super admins can manage all libraries"
    ON libraries
    FOR ALL
    TO authenticated
    USING (
        get_user_access_level() = 1
    );

CREATE POLICY "Institution admins can manage their libraries"
    ON libraries
    FOR ALL
    TO authenticated
    USING (
        get_user_access_level() = 2
        AND institution_id = get_user_institution()
    );

CREATE POLICY "Library managers can view their libraries"
    ON libraries
    FOR SELECT
    TO authenticated
    USING (
        get_user_access_level() = 3
        AND EXISTS (
            SELECT 1 FROM library_access
            WHERE library_id = libraries.id
            AND profile_id = auth.uid()
        )
    );

-- Add policy for library creation
CREATE POLICY "Users can create libraries for their institution"
    ON libraries
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (get_user_access_level() = 1) OR
        (get_user_access_level() = 2 AND institution_id = get_user_institution())
    );

-- Create RLS policies for library_access
CREATE POLICY "Super admins can manage all library access"
    ON library_access
    FOR ALL
    TO authenticated
    USING (
        get_user_access_level() = 1
    );

CREATE POLICY "Institution admins can manage their library access"
    ON library_access
    FOR ALL
    TO authenticated
    USING (
        get_user_access_level() = 2
        AND EXISTS (
            SELECT 1 FROM libraries
            WHERE libraries.id = library_access.library_id
            AND libraries.institution_id = get_user_institution()
        )
    );

-- Add default_library_id to institutions table
ALTER TABLE institutions
    ADD COLUMN IF NOT EXISTS default_library_id UUID REFERENCES libraries(id);

-- Update organization_structure to include library assignments
ALTER TABLE institutions
    ALTER COLUMN organization_structure SET DEFAULT jsonb_build_object(
        'level3', jsonb_build_object(
            'max_users', 5,
            'libraries', jsonb_build_array()
        ),
        'level4', jsonb_build_object(
            'types', jsonb_build_object(
                'students', jsonb_build_object(
                    'max_books', 5,
                    'loan_duration', 14,
                    'reservation_duration', 7,
                    'fine_per_day', 1.00
                ),
                'faculty', jsonb_build_object(
                    'max_books', 10,
                    'loan_duration', 30,
                    'reservation_duration', 14,
                    'fine_per_day', 0.50
                ),
                'graduate_students', jsonb_build_object(
                    'max_books', 8,
                    'loan_duration', 21,
                    'reservation_duration', 10,
                    'fine_per_day', 0.75
                ),
                'patrons', jsonb_build_object(
                    'max_books', 3,
                    'loan_duration', 7,
                    'reservation_duration', 3,
                    'fine_per_day', 2.00
                )
            )
        )
    ); 