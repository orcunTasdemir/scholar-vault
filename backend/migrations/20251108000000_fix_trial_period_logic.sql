-- Fix trial period logic: remove automatic trial assignment
-- Trial should only start when user explicitly upgrades to Researcher tier via Stripe

-- 1. Remove the default value from trial_end_date for new users
ALTER TABLE users ALTER COLUMN trial_end_date DROP DEFAULT;

-- 2. Set trial_end_date to NULL for all Student tier users who haven't explicitly started a trial
-- (We identify these as users with no Stripe customer ID, meaning they never went through checkout)
UPDATE users
SET trial_end_date = NULL
WHERE subscription_tier = 'student'
  AND stripe_customer_id IS NULL;

-- Note: Users who have a stripe_customer_id have gone through Stripe checkout and their trial is legitimate