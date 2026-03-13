-- First, create a function to handle admin user creation and profile setup
CREATE OR REPLACE FUNCTION create_institution_admin(
    p_email TEXT,
    p_password TEXT,
    p_name TEXT,
    p_institution_id UUID
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Create user in auth.users
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"' || p_name || '"}',
        false,
        'authenticated'
    ) RETURNING id INTO v_user_id;

    -- Create profile for the admin
    INSERT INTO profiles (
        id,
        email,
        name,
        role,
        institution_id,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        p_email,
        p_name,
        'admin',
        p_institution_id,
        NOW(),
        NOW()
    );

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update institutions table structure
ALTER TABLE institutions
    -- Remove columns that are now in organization_structure
    DROP COLUMN IF EXISTS reserve_duration_days,
    DROP COLUMN IF EXISTS loan_duration_days,
    DROP COLUMN IF EXISTS late_fine_per_day,
    DROP COLUMN IF EXISTS rules,
    DROP COLUMN IF EXISTS admin_password,
    
    -- Add admin_name if not exists
    ADD COLUMN IF NOT EXISTS admin_name TEXT,
    
    -- Update organization_structure to include all settings
    ALTER COLUMN organization_structure SET DEFAULT '{
        "roles": ["admin", "librarian", "student", "faculty"],
        "limits": {
            "admin": {
                "max_days": 30,
                "max_books": 10,
                "reserve_duration": 7,
                "loan_duration": 30,
                "fine_per_day": 1.00
            },
            "faculty": {
                "max_days": 30,
                "max_books": 10,
                "reserve_duration": 7,
                "loan_duration": 30,
                "fine_per_day": 1.00
            },
            "student": {
                "max_days": 14,
                "max_books": 5,
                "reserve_duration": 7,
                "loan_duration": 14,
                "fine_per_day": 1.00
            },
            "librarian": {
                "max_days": 30,
                "max_books": 15,
                "reserve_duration": 7,
                "loan_duration": 30,
                "fine_per_day": 1.00
            }
        },
        "descriptions": {
            "admin": "Full system access and management",
            "faculty": "Extended borrowing privileges",
            "student": "Basic borrowing privileges",
            "librarian": "Book management and user assistance"
        }
    }'::jsonb;

-- Create library_managers table for managing library staff
CREATE TABLE IF NOT EXISTS library_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('librarian', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(library_id, user_id)
);

-- Create a function to migrate existing data
CREATE OR REPLACE FUNCTION migrate_institution_data()
RETURNS void AS $$
DECLARE
    inst RECORD;
    default_lib_id UUID;
    admin_user_id UUID;
BEGIN
    FOR inst IN SELECT * FROM institutions LOOP
        -- Create admin user and profile if not exists
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE email = inst.admin_email 
            AND institution_id = inst.id
        ) THEN
            admin_user_id := create_institution_admin(
                inst.admin_email,
                'temporary_password', -- This should be changed by the admin on first login
                inst.admin_name,
                inst.id
            );
        END IF;

        -- Create default library if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM libraries 
            WHERE institution_id = inst.id 
            AND is_default = true
        ) THEN
            INSERT INTO libraries (
                institution_id, 
                name, 
                address, 
                is_default
            )
            VALUES (
                inst.id, 
                inst.name || ' Library', 
                inst.address, 
                true
            )
            RETURNING id INTO default_lib_id;
            
            -- Add the admin as a library manager
            INSERT INTO library_managers (
                library_id,
                user_id,
                role
            )
            VALUES (
                default_lib_id,
                admin_user_id,
                'manager'
            );
        END IF;
        
        -- Update organization_structure if it's in the old format
        IF inst.organization_structure->>'level3' IS NOT NULL THEN
            UPDATE institutions
            SET organization_structure = jsonb_build_object(
                'roles', ARRAY['admin', 'librarian', 'student', 'faculty'],
                'limits', jsonb_build_object(
                    'admin', jsonb_build_object(
                        'max_days', 30,
                        'max_books', 10,
                        'reserve_duration', 7,
                        'loan_duration', 30,
                        'fine_per_day', 1.00
                    ),
                    'faculty', jsonb_build_object(
                        'max_days', 30,
                        'max_books', 10,
                        'reserve_duration', 7,
                        'loan_duration', 30,
                        'fine_per_day', 1.00
                    ),
                    'student', jsonb_build_object(
                        'max_days', 14,
                        'max_books', 5,
                        'reserve_duration', 7,
                        'loan_duration', 14,
                        'fine_per_day', 1.00
                    ),
                    'librarian', jsonb_build_object(
                        'max_days', 30,
                        'max_books', 15,
                        'reserve_duration', 7,
                        'loan_duration', 30,
                        'fine_per_day', 1.00
                    )
                ),
                'descriptions', jsonb_build_object(
                    'admin', 'Full system access and management',
                    'faculty', 'Extended borrowing privileges',
                    'student', 'Basic borrowing privileges',
                    'librarian', 'Book management and user assistance'
                )
            )
            WHERE id = inst.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_institution_data();

-- Drop the migration function
DROP FUNCTION migrate_institution_data();
DROP FUNCTION create_institution_admin();

-- Add RLS policies for library_managers
ALTER TABLE library_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all library managers"
    ON library_managers
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Institution admins can manage their library managers"
    ON library_managers
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN libraries l ON l.institution_id = p.institution_id
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
            AND l.id = library_managers.library_id
        )
    );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_library_managers_library_id ON library_managers(library_id);
CREATE INDEX IF NOT EXISTS idx_library_managers_user_id ON library_managers(user_id);

-- Update RLS policies to include default_library_id
CREATE POLICY "Super admins can manage all institutions"
    ON institutions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Institution admins can manage their institution"
    ON institutions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
            AND profiles.institution_id = institutions.id
        )
    );

-- Add index for default_library_id
CREATE INDEX IF NOT EXISTS idx_institutions_default_library_id ON institutions(default_library_id); 