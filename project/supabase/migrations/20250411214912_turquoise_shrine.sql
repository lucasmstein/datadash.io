/*
  # Subscription System Updates

  1. Changes
    - Add usage tracking to subscriptions
    - Add features and limits to subscription plans
    - Add trial period tracking to subscriptions
    - Add unique constraint on subscription plan names
  
  2. Security
    - Enable RLS on subscription_plans
    - Add policy for public access to subscription plans
  
  3. Data
    - Insert default subscription plans with features and limits
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
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Anyone can view subscription plans'
  ) THEN
    CREATE POLICY "Anyone can view subscription plans"
      ON subscription_plans
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Function to safely upsert subscription plans
CREATE OR REPLACE FUNCTION upsert_subscription_plan(
  p_name TEXT,
  p_description TEXT,
  p_price_monthly NUMERIC,
  p_stripe_price_id TEXT,
  p_features JSONB,
  p_limits JSONB
) RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM subscription_plans WHERE name = p_name) THEN
    UPDATE subscription_plans SET
      description = p_description,
      price_monthly = p_price_monthly,
      stripe_price_id = p_stripe_price_id,
      features = p_features,
      limits = p_limits,
      updated_at = now()
    WHERE name = p_name;
  ELSE
    INSERT INTO subscription_plans (
      id, name, description, price_monthly, stripe_price_id, features, limits
    ) VALUES (
      gen_random_uuid(), p_name, p_description, p_price_monthly, p_stripe_price_id, p_features, p_limits
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert or update subscription plans
SELECT upsert_subscription_plan(
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