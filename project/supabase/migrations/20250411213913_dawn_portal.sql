-- Add usage column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'usage'
  ) THEN
    ALTER TABLE subscriptions 
    ADD COLUMN usage JSONB DEFAULT '{}'::jsonb NOT NULL;
  END IF;
END $$;

-- Add comment explaining the usage column
COMMENT ON COLUMN subscriptions.usage IS 'Stores usage metrics like AI requests count';