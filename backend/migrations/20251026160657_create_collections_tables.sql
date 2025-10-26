-- Add migration script here
-- Create collections (folders) table with self-referential parent_id for nesting
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Create junction table for many-to-many relationship between documents and collections
CREATE TABLE document_collections (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (document_id, collection_id)
);
-- Indexes for faster queries
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_parent_id ON collections(parent_id);
CREATE INDEX idx_document_collections_document_id ON document_collections(document_id);
CREATE INDEX idx_document_collections_collection_id ON document_collections(collection_id);
-- Trigger for auto-updating updated_at on collections
CREATE TRIGGER update_collections_updated_at BEFORE
UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();