/*
  # Promote initial user to admin role
  
  1. Changes
    - Updates the current user's role to admin
    - Only updates if current role is 'user'
  
  2. Security
    - Only affects the executing user
    - Maintains role constraints
*/

-- Update specific user to admin role
UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid()
AND role = 'user'
RETURNING id;