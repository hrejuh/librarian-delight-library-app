-- Add missing enum value for super_admin to the user_role type
ALTER TYPE public.user_role
  ADD VALUE IF NOT EXISTS 'super_admin'; 