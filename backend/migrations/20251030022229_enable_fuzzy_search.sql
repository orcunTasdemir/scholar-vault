-- Add migration script here
-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Add GIN index for faster fuzzy searches
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_abstract_trgm ON documents USING GIN (abstract_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_journal_trgm ON documents USING GIN (journal gin_trgm_ops);