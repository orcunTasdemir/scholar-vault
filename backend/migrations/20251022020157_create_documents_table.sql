-- Add migration script here
-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Bibliography metadata
    title VARCHAR(500) NOT NULL,
    authors TEXT [],
    year INTEGER,
    publication_type VARCHAR(50),
    journal VARCHAR(255),
    volume VARCHAR(50),
    issue VARCHAR(50),
    pages VARCHAR(50),
    publisher VARCHAR(255),
    doi VARCHAR(255),
    url TEXT,
    abstract TEXT,
    keywords TEXT [],
    -- File info
    pdf_url TEXT,
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Create index on user_id for faster queries
CREATE INDEX idx_documents_user_id ON documents(user_id);
-- Create index on title for search
CREATE INDEX idx_documents_title ON documents(title);
-- Create trigger to auto-update updated_at
CREATE TRIGGER update_documents_updated_at BEFORE
UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();