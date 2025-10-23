-- Add migration script here
-- RENAME abstract column to abstract_text to match the document struct in rust backend
ALTER TABLE documents
    RENAME COLUMN abstract TO abstract_text;