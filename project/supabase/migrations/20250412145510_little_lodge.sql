/*
  # Add function to delete users
  
  1. Changes
    - Add function to safely delete users and their data
    - Only admins can execute this function
    - Cascading deletion through foreign key relationships
  
  2. Security
    - Function is SECURITY DEFINER
    - Only admins can execute
    - Proper error handling and validation
*/

-- Function to delete a user and all associated data
CREATE OR REPLACE FUNCTION delete_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Check if the executing user is an admin
  SELECT (role = 'admin') INTO is_admin_user
  FROM profiles
  WHERE id = auth.uid();

  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;

  -- Delete the user from auth.users (this will cascade to profiles and other tables)
  DELETE FROM auth.users
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users (but function will still check for admin role)
GRANT EXECUTE ON FUNCTION delete_user(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION delete_user IS 'Deletes a user and all associated data (admin only)';