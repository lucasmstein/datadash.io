/*
  # Add preferences to profiles table

  1. Changes
    - Add email_notifications column (boolean)
    - Add two_factor_enabled column (boolean)
    - Add updated_at column (timestamp)

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();