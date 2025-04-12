/*
  # Fix profile creation with stored procedure

  1. Changes
    - Create a stored procedure to safely handle profile creation
    - Handle race conditions and duplicates
    - Add proper error handling
  
  2. Security
    - Maintain existing RLS policies
    - Use SECURITY DEFINER for elevated privileges
*/

-- Create a stored procedure to safely handle profile creation
CREATE OR REPLACE PROCEDURE handle_profile_creation(
  user_id UUID,
  user_full_name TEXT,
  user_company_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use a transaction to ensure atomicity
  BEGIN
    -- Try to insert the profile
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
      user_full_name,
      user_company_name,
      false,
      false,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;

    -- If insert failed (profile exists), try to update
    IF NOT FOUND THEN
      UPDATE profiles SET
        full_name = user_full_name,
        company_name = user_company_name,
        updated_at = now()
      WHERE id = user_id;
    END IF;

    COMMIT;
  EXCEPTION WHEN OTHERS THEN
    -- Log error details (in production, use proper logging)
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
    ROLLBACK;
    RAISE;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON PROCEDURE handle_profile_creation(UUID, TEXT, TEXT) TO authenticated;