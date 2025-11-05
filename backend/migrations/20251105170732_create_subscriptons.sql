-- Add migration script here
-- Add subscription tier to users table
ALTER TABLE users
ADD COLUMN subscription_tier VARCHAR(20) NOT NULL DEFAULT 'student',
    ADD COLUMN subscription_status VARCHAR(20) NOT NULL DEFAULT 'active',
    ADD COLUMN stripe_customer_id VARCHAR(255),
    ADD COLUMN stripe_subscription_id VARCHAR(255),
    ADD COLUMN subscription_start_date TIMESTAMPTZ,
    ADD COLUMN subscription_end_date TIMESTAMPTZ,
    ADD COLUMN trial_end_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days';
-- Create index for faster subscription lookups
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
-- Create usage tracking table for chat messages
CREATE TABLE chat_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tokens_used INTEGER NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Create index for faster usage queries
CREATE INDEX idx_chat_usage_user_id ON chat_usage(user_id);
CREATE INDEX idx_chat_usage_created_at ON chat_usage(created_at);
-- Create subscription events table for audit trail
CREATE TABLE subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    stripe_event_id VARCHAR(255) UNIQUE,
    old_tier VARCHAR(20),
    new_tier VARCHAR(20),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Create index for event lookups
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_stripe_event_id ON subscription_events(stripe_event_id);