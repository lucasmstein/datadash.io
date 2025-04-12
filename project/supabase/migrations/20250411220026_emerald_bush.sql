/*
  # Fix profile creation with improved stored procedure

  1. Changes
    - Create a more robust stored procedure for profile creation
    - Add proper error handling and logging
    - Ensure atomic transactions
    - Handle race conditions
  
  2. Security
    - Maintain existing RLS policies
    - Use SECURITY DEFINER for elevated privileges
    - Grant execute permissions to authenticated users
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_profile;

-- Create an improved stored procedure for profile creation
CREATE OR REPLACE PROCEDURE handle_profile_creation(
  user_id UUID,
  user_full_name TEXT,
  user_company_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now TIMESTAMPTZ := now();
BEGIN
  -- Use a transaction to ensure atomicity
  BEGIN
    -- Try to insert the profile first
    INSERT INTO profiles (
      id,
      full_name,
      company_name,
      email_notifications,
      two_factor_enabled,
      created_at,
      updated_at
    )
    VALUES (
      user_id,
      COALESCE(user_full_name, ''),
      COALESCE(user_company_name, ''),
      false,
      false,
      _now,
      _now
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      company_name = EXCLUDED.company_name,
      updated_at = _now
    WHERE profiles.id = user_id;

    -- Log successful operation
    RAISE NOTICE 'Profile created/updated successfully for user %', user_id;
    
    COMMIT;
  EXCEPTION WHEN OTHERS THEN
    -- Log error details
    RAISE WARNING 'Error in handle_profile_creation: % %', SQLERRM, SQLSTATE;
    ROLLBACK;
    RAISE;
  END;
END;
$$;

-- Revoke all existing permissions
REVOKE ALL ON PROCEDURE handle_profile_creation(UUID, TEXT, TEXT) FROM PUBLIC;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON PROCEDURE handle_profile_creation(UUID, TEXT, TEXT) TO authenticated;

-- Add comment explaining the procedure
COMMENT ON PROCEDURE handle_profile_creation IS 'Safely creates or updates a user profile with proper error handling and atomic transactions';