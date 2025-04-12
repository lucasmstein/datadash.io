/*
  # Add subscription limits check function

  1. New Functions
    - `check_subscription_limit`: Checks if a user has exceeded their subscription limits
    - `increment_usage_counter`: Safely increments usage counters with proper error handling

  2. Security
    - Functions are SECURITY DEFINER to run with elevated privileges
    - Explicit search path to prevent search path injection
    - RLS policies remain unchanged
    - Execute permissions granted to authenticated users only

  3. Features
    - Atomic transactions for usage updates
    - Proper error handling and logging
    - Support for different limit types (AI requests, storage, etc.)
*/

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limit(
  user_id UUID,
  limit_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _subscription RECORD;
  _current_usage INTEGER;
  _limit INTEGER;
BEGIN
  -- Get user's subscription and plan details
  SELECT 
    s.*,
    sp.limits->>limit_type AS plan_limit
  INTO _subscription
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.user_id = user_id
  AND s.status = 'active';

  -- If no active subscription found, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get current usage for the limit type
  _current_usage := (_subscription.usage->>limit_type)::INTEGER;
  IF _current_usage IS NULL THEN
    _current_usage := 0;
  END IF;

  -- Get limit from plan
  _limit := _subscription.plan_limit::INTEGER;
  IF _limit IS NULL THEN
    RETURN false;
  END IF;

  -- Check if usage is within limits
  RETURN _current_usage < _limit;
END;
$$;

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION increment_usage_counter(
  user_id UUID,
  counter_type TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _subscription_id UUID;
  _current_usage JSONB;
BEGIN
  -- Get subscription ID and current usage
  SELECT id, usage INTO _subscription_id, _current_usage
  FROM subscriptions
  WHERE user_id = user_id
  AND status = 'active'
  FOR UPDATE;  -- Lock the row for update

  -- If no active subscription found, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Initialize usage object if null
  IF _current_usage IS NULL THEN
    _current_usage := '{}'::jsonb;
  END IF;

  -- Update the usage counter
  UPDATE subscriptions
  SET usage = jsonb_set(
    COALESCE(_current_usage, '{}'::jsonb),
    ARRAY[counter_type],
    to_jsonb(
      COALESCE((_current_usage->>counter_type)::INTEGER, 0) + increment_by
    )
  )
  WHERE id = _subscription_id;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Log error details
  RAISE WARNING 'Error incrementing usage counter: % %', SQLERRM, SQLSTATE;
  RETURN false;
END;
$$;

-- Revoke all existing permissions
REVOKE ALL ON FUNCTION check_subscription_limit(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION increment_usage_counter(UUID, TEXT, INTEGER) FROM PUBLIC;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_subscription_limit(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage_counter(UUID, TEXT, INTEGER) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION check_subscription_limit IS 'Checks if a user has exceeded their subscription limits for a specific feature';
COMMENT ON FUNCTION increment_usage_counter IS 'Safely increments usage counters for subscription tracking';