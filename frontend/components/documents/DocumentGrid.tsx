"use client";

import { Document, Collection } from "@/lib/api";
import { DocumentCard } from "./DocumentCard";
import Image from "next/image";

interface DocumentGridProps {
  documents: Document[];
  collections: Collection[];
  selectedCollectionId: string | null;
  selectedCollectionName: string | null;
  isLoading: boolean;
  onAddToCollection: (documentId: string, collectionId: string) => void;
  onRemoveFromCollection: (documentId: string) => void;
  onDelete: (documentId: string) => void;
}

export function DocumentGrid({
  documents,
  collections,
  selectedCollectionId,
  selectedCollectionName,
  isLoading,
  onAddToCollection,
  onRemoveFromCollection,
  onDelete,
}: DocumentGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="text-center py-16 rounded-lg border-2 border-dashed">
        <Image
          src="/logo.png"
          alt="No documents"
          width={64}
          height={64}
          className="mx-auto opacity-50"
        />
        <h3 className="mt-4 text-lg font-semibold">
          {selectedCollectionId
            ? "No documents in this collection"
            : "No documents yet"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {selectedCollectionId
            ? "Add documents to this collection to see them here."
            : "Get started by uploading your first research document."}
        </p>
        {!selectedCollectionId && (
          <p className="mt-1 text-xs text-muted-foreground">
            We&apos;ll automatically extract metadata from your PDFs!
          </p>
        )}
      </div>
    );
  }

  // Grid of documents
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          selectedCollectionName={selectedCollectionName}
          onAddToCollection={onAddToCollection}
          onRemoveFromCollection={onRemoveFromCollection}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
