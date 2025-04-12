/*
  # Add INSERT policy for profiles table

  1. Security Changes
    - Add INSERT policy for profiles table to allow authenticated users to create their own profile
    - Policy ensures users can only create a profile with their own user ID

  Note: This complements existing policies that allow users to view and update their own profiles
*/

CREATE POLICY "Users can create own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);