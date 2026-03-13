-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    access_level INTEGER NOT NULL CHECK (access_level BETWEEN 1 AND 4),
    description TEXT,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(name, institution_id)
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    access_level INTEGER NOT NULL CHECK (access_level BETWEEN 1 AND 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions mapping table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (role_id, permission_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS roles_institution_id_idx ON roles(institution_id);
CREATE INDEX IF NOT EXISTS roles_access_level_idx ON roles(access_level);
CREATE INDEX IF NOT EXISTS permissions_access_level_idx ON permissions(access_level);
CREATE INDEX IF NOT EXISTS role_permissions_role_id_idx ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx ON role_permissions(permission_id);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles
CREATE POLICY "Super admins can manage all roles"
    ON roles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 1
        )
    );

CREATE POLICY "Institution admins can manage their roles"
    ON roles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 2
            AND profiles.institution_id = roles.institution_id
        )
    );

-- RLS Policies for permissions
CREATE POLICY "Super admins can manage all permissions"
    ON permissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 1
        )
    );

-- RLS Policies for role_permissions
CREATE POLICY "Super admins can manage all role permissions"
    ON role_permissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.access_level = 1
        )
    );

CREATE POLICY "Institution admins can manage their role permissions"
    ON role_permissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN roles r ON r.id = role_permissions.role_id
            WHERE p.id = auth.uid()
            AND p.access_level = 2
            AND p.institution_id = r.institution_id
        )
    );

-- Insert default permissions
INSERT INTO permissions (name, description, access_level) VALUES
    ('manage_system', 'Full system management access', 1),
    ('manage_all_institutions', 'Manage all institutions', 1),
    ('view_system_reports', 'View system-wide reports', 1),
    ('manage_system_settings', 'Manage system settings', 1),
    ('manage_institution', 'Manage institution settings', 2),
    ('manage_libraries', 'Manage libraries within institution', 2),
    ('manage_institution_users', 'Manage institution users', 2),
    ('manage_institution_roles', 'Manage institution roles', 2),
    ('view_institution_reports', 'View institution reports', 2),
    ('manage_institution_settings', 'Manage institution settings', 2),
    ('manage_library', 'Manage library settings', 3),
    ('manage_books', 'Manage library books', 3),
    ('manage_borrowings', 'Manage book borrowings', 3),
    ('manage_reservations', 'Manage book reservations', 3),
    ('view_library_reports', 'View library reports', 3),
    ('manage_library_settings', 'Manage library settings', 3),
    ('borrow_books', 'Borrow books', 4),
    ('reserve_books', 'Reserve books', 4),
    ('view_own_history', 'View own borrowing history', 4),
    ('view_own_fines', 'View own fines', 4)
ON CONFLICT (name) DO NOTHING; 