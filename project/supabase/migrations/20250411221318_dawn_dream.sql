/*
  # Add admin role support
  
  1. Changes
    - Add role column to profiles table
    - Add default role constraint
    - Update RLS policies to support admin access
    - Add admin-specific functions
    
  2. Security
    - Maintain existing RLS
    - Add admin-specific policies
    - Ensure proper role validation
*/

-- Add role column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

    -- Add check constraint for valid roles
    ALTER TABLE profiles
    ADD CONSTRAINT valid_role
    CHECK (role IN ('admin', 'user'));
  END IF;
END $$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Update RLS policies for admin access

-- Profiles policies
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin() OR auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin() OR auth.uid() = id)
  WITH CHECK (is_admin() OR auth.uid() = id);

-- Dashboards policies
CREATE POLICY "Admins can view all dashboards"
  ON dashboards
  FOR SELECT
  TO authenticated
  USING (is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can update all dashboards"
  ON dashboards
  FOR UPDATE
  TO authenticated
  USING (is_admin() OR auth.uid() = user_id)
  WITH CHECK (is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can delete all dashboards"
  ON dashboards
  FOR DELETE
  TO authenticated
  USING (is_admin() OR auth.uid() = user_id);

-- Function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;

  -- Update user role
  UPDATE profiles
  SET 
    role = 'admin',
    updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

-- Function to demote admin to user
CREATE OR REPLACE FUNCTION demote_to_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can demote users';
  END IF;

  -- Prevent self-demotion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot demote yourself';
  END IF;

  -- Update user role
  UPDATE profiles
  SET 
    role = 'user',
    updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION promote_to_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION demote_to_user(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION is_admin IS 'Checks if the current user has admin role';
COMMENT ON FUNCTION promote_to_admin IS 'Promotes a user to admin role (admin only)';
COMMENT ON FUNCTION demote_to_user IS 'Demotes an admin to user role (admin only)';