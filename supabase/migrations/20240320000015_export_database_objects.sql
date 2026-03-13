-- Drop the existing function first
DROP FUNCTION IF EXISTS export_database_objects();

CREATE OR REPLACE FUNCTION export_database_objects()
RETURNS TABLE (
    object_type text,
    schema_name text,
    object_name text,
    details jsonb
) AS $$
BEGIN
    -- Export policies
    RETURN QUERY
    SELECT 
        'POLICY'::text as object_type,
        schemaname::text as schema_name,
        tablename || '.' || policyname as object_name,
        jsonb_build_object(
            'permissive', permissive,
            'roles', roles,
            'cmd', cmd,
            'qual', qual,
            'with_check', with_check
        ) as details
    FROM pg_policies
    ORDER BY schemaname, tablename, policyname;

    -- Export functions
    RETURN QUERY
    SELECT 
        'FUNCTION'::text as object_type,
        n.nspname::text as schema_name,
        p.proname::text as object_name,
        jsonb_build_object(
            'definition', pg_get_functiondef(p.oid),
            'arguments', pg_get_function_arguments(p.oid)
        ) as details
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY n.nspname, p.proname;

    -- Export triggers
    RETURN QUERY
    SELECT 
        'TRIGGER'::text as object_type,
        n.nspname::text as schema_name,
        c.relname || '.' || t.tgname as object_name,
        jsonb_build_object(
            'definition', pg_get_triggerdef(t.oid)
        ) as details
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE NOT t.tgisinternal
    ORDER BY n.nspname, c.relname, t.tgname;

    -- Export RLS status
    RETURN QUERY
    SELECT 
        'RLS'::text as object_type,
        n.nspname::text as schema_name,
        c.relname::text as object_name,
        jsonb_build_object(
            'enabled', c.relrowsecurity
        ) as details
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relkind = 'r'
    ORDER BY n.nspname, c.relname;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM export_database_objects(); 