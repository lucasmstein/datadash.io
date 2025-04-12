/*
  # Fix subscription plans setup

  1. Changes
    - Drop and recreate unique constraint on name
    - Clear existing data to avoid conflicts
    - Insert subscription plans with fixed IDs
  
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing unique constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscription_plans_name_key'
  ) THEN
    ALTER TABLE subscription_plans
    DROP CONSTRAINT subscription_plans_name_key;
  END IF;
END $$;

-- Clear existing data
TRUNCATE TABLE subscription_plans CASCADE;

-- Add unique constraint after clearing data
ALTER TABLE subscription_plans
ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);

-- Insert subscription plans with fixed IDs
INSERT INTO subscription_plans (
  id, name, description, price_monthly, stripe_price_id, features, limits, created_at, updated_at
) VALUES
  (
    '00000000-0000-4000-a000-000000000001',
    'Free',
    'Perfect for getting started',
    0,
    'price_free',
    '[
      "Up to 3 dashboards",
      "Basic data visualization",
      "CSV file upload",
      "Email support"
    ]'::jsonb,
    '{
      "dashboards": 3,
      "fileSizeMb": 5,
      "aiRequests": 10
    }'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-a000-000000000002',
    'Starter',
    'For growing businesses',
    29,
    'price_starter',
    '[
      "Unlimited dashboards",
      "Advanced visualizations",
      "Priority support",
      "Export to PDF"
    ]'::jsonb,
    '{
      "dashboards": 999999,
      "fileSizeMb": 25,
      "aiRequests": 100
    }'::jsonb,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-a000-000000000003',
    'Pro',
    'For power users',
    99,
    'price_pro',
    '[
      "Everything in Starter",
      "Custom branding",
      "Team collaboration",
      "Advanced AI features",
      "Priority support",
      "Custom integrations",
      "API access",
      "Dedicated account manager"
    ]'::jsonb,
    '{
      "dashboards": 999999,
      "fileSizeMb": 100,
      "aiRequests": 999999
    }'::jsonb,
    NOW(),
    NOW()
  );