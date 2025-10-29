"use client";

import { Document } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddToCollectionDropdown } from "@/components/AddToCollectionModal";
import { Collection } from "@/lib/api";
import { FolderPlus, Eye, Trash2, Calendar, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentCardProps {
  document: Document;
  collections: Collection[];
  selectedCollectionId: string | null;
  onAddToCollection: (documentId: string, collectionId: string) => void;
  onRemoveFromCollection: (e: React.MouseEvent, documentId: string) => void;
  onDelete: (e: React.MouseEvent, documentId: string) => void;
}

export function DocumentCard({
  document,
  collections,
  selectedCollectionId,
  onAddToCollection,
  onRemoveFromCollection,
  onDelete,
}: DocumentCardProps) {
  const router = useRouter();
  const isInCollection = selectedCollectionId !== null;

  return (
    <div className="border rounded-lg bg-white hover:shadow-md transition-shadow group">
      {/* Document Info - Clickable */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => router.push(`/dashboard/documents/${document.id}`)}
      >
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-2 mb-2">{document.title}</h3>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {document.authors && document.authors.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {document.authors[0]}
                    {document.authors.length > 1 && ` +${document.authors.length - 1}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>{new Date(document.created_at).toLocaleDateString()}</span>
                </div>
                {document.year && <span>{document.year}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Compact */}
      <div
        className="flex items-center gap-1 p-2 border-t bg-gray-50"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/documents/${document.id}`);
          }}
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">View</span>
        </Button>

        {isInCollection ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => onRemoveFromCollection(e, document.id)}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              title="Remove from collection"
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => onDelete(e, document.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete document"
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
                  title="Add to collection"
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
              onClick={(e) => onDelete(e, document.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
