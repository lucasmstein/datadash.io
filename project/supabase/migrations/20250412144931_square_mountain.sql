/*
  # Add create_profile function
  
  1. New Functions
    - `create_profile`: Creates a new profile for a user
      - Parameters:
        - user_id (UUID): The user's ID
        - user_full_name (TEXT): The user's full name
        - user_company_name (TEXT): The user's company name
      
  2. Security
    - Function is accessible to authenticated users only
    - Function can only create a profile for the authenticated user
*/

CREATE OR REPLACE FUNCTION public.create_profile(
  user_id UUID,
  user_full_name TEXT,
  user_company_name TEXT
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify the user is creating their own profile
  IF auth.uid() <> user_id THEN
    RAISE EXCEPTION 'Not allowed to create profile for other users';
  END IF;

  -- Insert the new profile
  INSERT INTO public.profiles (
    id,
    full_name,
    company_name,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_full_name,
    user_company_name,
    now(),
    now()
  );

EXCEPTION
  WHEN unique_violation THEN
    -- If profile already exists, update it
    UPDATE public.profiles
    SET
      full_name = user_full_name,
      company_name = user_company_name,
      updated_at = now()
    WHERE id = user_id;
END;
$$;