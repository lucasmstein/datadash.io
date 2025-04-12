/*
  # Subscription Plans Update
  
  1. Changes
    - Add usage tracking to subscriptions
    - Add features and limits to subscription plans
    - Add trial period tracking
    - Set up RLS policies
    - Insert default subscription plans
  
  2. Security
    - Enable RLS on subscription_plans table
    - Add policy for public read access
*/

-- Add usage column to subscriptions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'usage'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN usage JSONB DEFAULT '{}'::jsonb NOT NULL;

    COMMENT ON COLUMN subscriptions.usage IS 'Stores usage metrics like AI requests count';
  END IF;
END $$;

-- Add features and limits to subscription_plans if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'features'
  ) THEN
    ALTER TABLE subscription_plans 
    ADD COLUMN features JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'limits'
  ) THEN
    ALTER TABLE subscription_plans 
    ADD COLUMN limits JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add trial period tracking to subscriptions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'trial_start'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN trial_start TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'trial_end'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN trial_end TIMESTAMPTZ;
  END IF;
END $$;

-- Enable RLS on subscription_plans if not already enabled
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create a new one
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view subscription plans" ON subscription_plans;
  
  CREATE POLICY "Anyone can view subscription plans"
    ON subscription_plans
    FOR SELECT
    TO public
    USING (true);
END $$;

-- Function to safely upsert subscription plans
CREATE OR REPLACE FUNCTION upsert_subscription_plan(
  p_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_price_monthly NUMERIC,
  p_stripe_price_id TEXT,
  p_features JSONB,
  p_limits JSONB
) RETURNS void AS $$
BEGIN
  INSERT INTO subscription_plans (
    id, name, description, price_monthly, stripe_price_id, features, limits, created_at, updated_at
  ) VALUES (
    p_id, p_name, p_description, p_price_monthly, p_stripe_price_id, p_features, p_limits, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = p_name,
    description = p_description,
    price_monthly = p_price_monthly,
    stripe_price_id = p_stripe_price_id,
    features = p_features,
    limits = p_limits,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Clear existing data and insert default plans
TRUNCATE TABLE subscription_plans CASCADE;

SELECT upsert_subscription_plan(
  '00000000-0000-4000-a000-000000000001'::UUID,
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
  }'::jsonb
);

SELECT upsert_subscription_plan(
  '00000000-0000-4000-a000-000000000002'::UUID,
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
  }'::jsonb
);

SELECT upsert_subscription_plan(
  '00000000-0000-4000-a000-000000000003'::UUID,
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
  }'::jsonb
);