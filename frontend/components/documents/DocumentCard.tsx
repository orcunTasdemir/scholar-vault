"use client";

import { useState } from "react";
import { Document } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddToCollectionDropdown } from "@/components/AddToCollectionModal";
import { RemoveFromCollectionDialog } from "@/components/dialog/RemoveFromCollectionDialog";
import { DeleteDocumentDialog } from "@/components/dialog/DeleteDocumentDialog";
import { Collection } from "@/lib/api";
import {
  FolderPlus,
  Eye,
  Trash2,
  Calendar,
  User,
  FileText,
  FolderMinus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface DocumentCardProps {
  document: Document;
  collections: Collection[];
  selectedCollectionId: string | null;
  selectedCollectionName: string | null;
  onAddToCollection: (documentId: string, collectionId: string) => void;
  onRemoveFromCollection: (documentId: string) => void;
  onDelete: (documentId: string) => void;
  matchedFields?: string[];
}

export function DocumentCard({
  document,
  collections,
  selectedCollectionId,
  selectedCollectionName,
  onAddToCollection,
  onRemoveFromCollection,
  onDelete,
  matchedFields,
}: DocumentCardProps) {
  const router = useRouter();
  const isInCollection = selectedCollectionId !== null;
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleRemoveConfirm = () => {
    onRemoveFromCollection(document.id);
    setRemoveDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    onDelete(document.id);
    setDeleteDialogOpen(false);
  };

  return (
    <div className="rounded-lg bg-deep-charcoal/80 backdrop-blur-sm text-off-white hover:shadow-lg hover:bg-deep-charcoal/90 transition-all border border-off-white/10 flex flex-col">
      {/* Document Info - Clickable */}
      <div
        className="p-4 cursor-pointer flex-1"
        onClick={() => router.push(`/dashboard/documents/${document.id}`)}
      >
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 shrink-0 text-muted-teal mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-2 mb-2 min-h-[2.5rem]">
              {document.title}
            </h3>
            {/* Match Indicators - NEW */}
            {matchedFields && matchedFields.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {matchedFields.map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-old-paper-yellow/20 text-old-paper-yellow border border-old-paper-yellow/30 rounded text-xs font-medium"
                  >
                    <Search className="w-3 h-3" />
                    {field === "title" && "Title"}
                    {field === "authors" && "Authors"}
                    {field === "keywords" && "Keywords"}
                    {field === "abstract" && "Abstract"}
                    {field === "journal" && "Journal"}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-1 text-xs text-off-white/70">
              {document.authors && document.authors.length > 0 && (
                <div className="flex items-center gap-1.5 min-h-[1.25rem]">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {document.authors[0]}
                    {document.authors.length > 1 &&
                      ` +${document.authors.length - 1}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>
                    {new Date(document.created_at).toLocaleDateString()}
                  </span>
                </div>
                {document.year && <span>{document.year}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div
        className="flex items-center gap-1 p-2 border-t border-off-white/10 mt-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/documents/${document.id}`);
          }}
          className="flex-1 text-off-white hover:bg-muted-teal/20 hover:text-muted-teal"
        >
          <Eye className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">View</span>
        </Button>

        {isInCollection ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setRemoveDialogOpen(true);
              }}
              className="text-old-paper-yellow hover:text-old-paper-yellow hover:bg-old-paper-yellow/20"
              title="Remove from collection"
              aria-label="Remove from collection"
            >
              <FolderMinus className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/20"
              title="Delete document"
              aria-label="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => e.stopPropagation()}
                  className="text-off-white hover:bg-muted-teal/20 hover:text-muted-teal"
                  title="Add to collection"
                  aria-label="Add to collection"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <AddToCollectionDropdown
                  collections={collections}
                  onSelect={(collectionId) =>
                    onAddToCollection(document.id, collectionId)
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/20"
              title="Delete document"
              aria-label="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Remove from Collection Dialog */}
      {isInCollection && selectedCollectionName && (
        <RemoveFromCollectionDialog
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          onConfirm={handleRemoveConfirm}
          collectionName={selectedCollectionName}
          documentTitle={document.title}
        />
      )}

      {/* Delete Document Dialog */}
      <DeleteDocumentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        documentTitle={document.title}
      />
    </div>
  );
}
