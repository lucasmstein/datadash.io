/*
  # Add Subscription Management Tables

  1. New Tables
    - `subscriptions`
      - Stores user subscription information
      - Links to Stripe customer and subscription IDs
      - Tracks plan limits and usage
    
    - `subscription_plans`
      - Defines available subscription plans
      - Stores plan limits and features
      - Links to Stripe price IDs

  2. Security
    - Enable RLS on new tables
    - Add policies for secure access
*/

-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL,
  stripe_price_id text NOT NULL,
  features jsonb NOT NULL,
  limits jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  status text NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  usage jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans
  FOR SELECT
  TO public
  USING (true);

-- Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default plans
INSERT INTO subscription_plans (name, description, price_monthly, stripe_price_id, features, limits)
VALUES
  ('Free', 'Perfect for getting started', 0, 'price_free', 
   '["Basic data visualization", "CSV file upload", "Email support"]'::jsonb,
   '{"dashboards": 3, "file_size_mb": 5, "ai_requests": 10}'::jsonb),
   
  ('Starter', 'For growing businesses', 29, 'price_starter',
   '["Unlimited dashboards", "Advanced visualizations", "Priority support", "Export to PDF"]'::jsonb,
   '{"dashboards": 999999, "file_size_mb": 25, "ai_requests": 100}'::jsonb),
   
  ('Pro', 'For power users', 99, 'price_pro',
   '["Everything in Starter", "Custom branding", "Team collaboration", "Advanced AI features"]'::jsonb,
   '{"dashboards": 999999, "file_size_mb": 100, "ai_requests": 999999}'::jsonb);

-- Add subscription_id to profiles
ALTER TABLE profiles
ADD COLUMN subscription_id uuid REFERENCES subscriptions(id);