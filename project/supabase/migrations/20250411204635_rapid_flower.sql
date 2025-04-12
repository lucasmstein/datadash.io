/*
  # Create dashboards table and policies

  1. Tables
    - `dashboards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `file_info` (jsonb)
      - `column_analysis` (jsonb)
      - `insights` (text[])
      - `visualizations` (jsonb[])
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to:
      - View own dashboards
      - Create dashboards
      - Update own dashboards
      - Delete own dashboards

  3. Performance
    - Add indexes for user_id and created_at
*/

-- Drop existing table and its dependencies if they exist
DROP TABLE IF EXISTS public.dashboards CASCADE;

-- Create dashboards table
CREATE TABLE public.dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  file_info jsonb NOT NULL DEFAULT '{}',
  column_analysis jsonb NOT NULL DEFAULT '{}',
  insights text[] DEFAULT ARRAY[]::text[],
  visualizations jsonb[] DEFAULT ARRAY[]::jsonb[],
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

-- Create policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dashboards' 
    AND policyname = 'Users can view their own dashboards'
  ) THEN
    CREATE POLICY "Users can view their own dashboards"
      ON public.dashboards
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dashboards' 
    AND policyname = 'Users can create dashboards'
  ) THEN
    CREATE POLICY "Users can create dashboards"
      ON public.dashboards
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dashboards' 
    AND policyname = 'Users can update their own dashboards'
  ) THEN
    CREATE POLICY "Users can update their own dashboards"
      ON public.dashboards
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dashboards' 
    AND policyname = 'Users can delete their own dashboards'
  ) THEN
    CREATE POLICY "Users can delete their own dashboards"
      ON public.dashboards
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON public.dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON public.dashboards(created_at DESC);