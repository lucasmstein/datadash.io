/*
  # Update RLS policies for dashboards table

  1. Security Changes
    - Enable RLS on dashboards table if not already enabled
    - Add policies if they don't exist:
      - Users can view their own dashboards
      - Users can create dashboards
      - Users can update their own dashboards
      - Users can delete their own dashboards

  2. Notes
    - All policies are scoped to authenticated users only
    - Access is restricted to dashboard owner (user_id matches auth.uid())
    - Added checks to prevent duplicate policy creation
*/

-- Enable RLS (idempotent)
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own dashboards" ON dashboards;
    DROP POLICY IF EXISTS "Users can create dashboards" ON dashboards;
    DROP POLICY IF EXISTS "Users can update own dashboards" ON dashboards;
    DROP POLICY IF EXISTS "Users can delete own dashboards" ON dashboards;
END $$;

-- Recreate policies
CREATE POLICY "Users can view own dashboards"
ON dashboards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create dashboards"
ON dashboards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboards"
ON dashboards
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboards"
ON dashboards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);