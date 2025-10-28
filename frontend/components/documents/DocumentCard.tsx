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
import { BookPlus, View, CircleX } from "lucide-react";

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
    <div
      className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
      onClick={() => router.push(`/dashboard/documents/${document.id}`)}
    >
      {/* Document Info */}
      <div className="mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          {document.title}
        </h3>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span>📅 {new Date(document.created_at).toLocaleDateString()}</span>
          {document.authors && document.authors.length > 0 && (
            <span>
              👤 {document.authors[0]}
              {document.authors.length > 1
                ? ` +${document.authors.length - 1}`
                : ""}
            </span>
          )}
          {document.year && <span>🗓️ {document.year}</span>}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="flex gap-2 mt-4 pt-4 border-t border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/documents/${document.id}`);
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <View className="w-4 h-4" />
          View
        </button>

        {isInCollection ? (
          <>
            <button
              onClick={(e) => onRemoveFromCollection(e, document.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Remove
            </button>
            <button
              onClick={(e) => onDelete(e, document.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <CircleX className="w-4 h-4" />
              Delete
            </button>
          </>
        ) : (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <BookPlus className="w-4 h-4" />+ Collection
                </button>
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

            <button
              onClick={(e) => onDelete(e, document.id)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <CircleX className="w-4 h-4" />
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
