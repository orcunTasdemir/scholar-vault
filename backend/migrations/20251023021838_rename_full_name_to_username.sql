-- Add migration script here
-- Rename full_name column to username
ALTER TABLE users
    RENAME COLUMN full_name TO username;