-- Add missing fields to libraries table
ALTER TABLE libraries
ADD COLUMN IF NOT EXISTS open_time time,
ADD COLUMN IF NOT EXISTS close_time time,
ADD COLUMN IF NOT EXISTS days_closed text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS resources text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS shelves jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS managed_by text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS user_types text[] DEFAULT '{}';

-- Add comments to explain the purpose of each field
COMMENT ON COLUMN libraries.open_time IS 'The time when the library opens';
COMMENT ON COLUMN libraries.close_time IS 'The time when the library closes';
COMMENT ON COLUMN libraries.days_closed IS 'Array of days when the library is closed';
COMMENT ON COLUMN libraries.resources IS 'Array of resource types available in the library';
COMMENT ON COLUMN libraries.shelves IS 'Array of shelf objects with id and description';
COMMENT ON COLUMN libraries.managed_by IS 'Array of user IDs who manage this library';
COMMENT ON COLUMN libraries.user_types IS 'Array of user types allowed to access this library';

-- Create GIN indexes for array fields to improve query performance
CREATE INDEX IF NOT EXISTS libraries_days_closed_idx ON libraries USING GIN (days_closed);
CREATE INDEX IF NOT EXISTS libraries_resources_idx ON libraries USING GIN (resources);
CREATE INDEX IF NOT EXISTS libraries_managed_by_idx ON libraries USING GIN (managed_by);
CREATE INDEX IF NOT EXISTS libraries_user_types_idx ON libraries USING GIN (user_types);
CREATE INDEX IF NOT EXISTS libraries_shelves_idx ON libraries USING GIN (shelves);

-- Update existing rows to set default values
UPDATE libraries
SET days_closed = COALESCE(days_closed, '{}'),
    resources = COALESCE(resources, '{}'),
    shelves = COALESCE(shelves, '[]'),
    managed_by = COALESCE(managed_by, '{}'),
    user_types = COALESCE(user_types, '{}')
WHERE days_closed IS NULL
   OR resources IS NULL
   OR shelves IS NULL
   OR managed_by IS NULL
   OR user_types IS NULL; 