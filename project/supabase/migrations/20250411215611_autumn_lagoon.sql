/*
  # Fix profile creation with stored procedure

  1. Changes
    - Add stored procedure for safe profile creation
    - Handle race conditions and duplicates
  
  2. Security
    - Maintain existing RLS policies
*/

-- Create a function to safely create a profile
CREATE OR REPLACE FUNCTION create_profile(
  user_id UUID,
  user_full_name TEXT,
  user_company_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  -- If profile already exists, update it instead
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    updated_at = now();
END;
$$;