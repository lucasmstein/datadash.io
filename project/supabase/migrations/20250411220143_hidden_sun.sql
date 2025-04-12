/*
  # Add language preferences to profiles

  1. New Columns
    - `language_preference` (text): Stores the user's preferred language code
    - Default to 'en' for English

  2. Changes
    - Add language_preference column to profiles table
    - Add check constraint to ensure valid language codes
    - Add function to update language preference
*/

-- Add language_preference column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'language_preference'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN language_preference TEXT NOT NULL DEFAULT 'en';

    -- Add check constraint for valid language codes
    ALTER TABLE profiles
    ADD CONSTRAINT valid_language_code
    CHECK (language_preference IN ('en', 'es', 'pt'));
  END IF;
END $$;

-- Function to update language preference
CREATE OR REPLACE FUNCTION update_language_preference(
  user_id UUID,
  new_language TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate language code
  IF new_language NOT IN ('en', 'es', 'pt') THEN
    RAISE EXCEPTION 'Invalid language code';
  END IF;

  -- Update the preference
  UPDATE profiles
  SET 
    language_preference = new_language,
    updated_at = now()
  WHERE id = user_id;

  RETURN FOUND;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error updating language preference: % %', SQLERRM, SQLSTATE;
  RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_language_preference(UUID, TEXT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION update_language_preference IS 'Updates a user''s language preference with validation';