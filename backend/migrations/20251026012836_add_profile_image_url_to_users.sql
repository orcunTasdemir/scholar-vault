-- Add migration script here
-- Add profile_image_url column to users table
ALTER TABLE users
ADD COLUMN profile_image_url TEXT;