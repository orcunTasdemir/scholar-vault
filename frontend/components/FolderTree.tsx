"use client";

import { useState } from "react";
import { Collection } from "@/lib/api";
import { BookMarked, BookOpen, BookX, Landmark, Pencil } from "lucide-react";

interface FolderTreeProps {
  collections: Collection[];
  selectedCollectionId: string | null;
  onSelectCollection: (collectionId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (collectionId: string) => void;
  onDeleteFolder: (collectionId: string) => void;
}

export function FolderTree({
  collections,
  selectedCollectionId,
  onSelectCollection,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // Build tree structure from flat array
  const buildTree = (parentId: string | null): Collection[] => {
    return collections
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const toggleExpand = (collectionId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const renderFolder = (collection: Collection, level: number = 0) => {
    const children = buildTree(collection.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders.has(collection.id);
    const isSelected = selectedCollectionId === collection.id;

    return (
      <div key={collection.id} className="flex flex-col">
        <div
          className={`flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-gray-100 ${
            isSelected ? "bg-blue-50 border-l-4 border-blue-600" : ""
          }`}
          style={{
            paddingLeft: `${level * 20 + 12}px`,
          }}
          onClick={() => onSelectCollection(collection.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(collection.id);
              }}
              className="w-4 h-4 flex items-center justify-center shrink-0"
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          {!hasChildren && <span className="w-4 shrink-0" />}
          <span className="shrink-0">
            {isSelected ? (
              <BookOpen className="w-4 h-4" />
            ) : (
              <BookMarked className="w-4 h-4" />
            )}
          </span>
          <span className="flex-1 text-sm truncate" title={collection.name}>
            {collection.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRenameFolder(collection.id);
            }}
            className="shrink-0 text-gray-500 hover:text-gray-700 p-1"
            title="Rename"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(collection.id);
            }}
            className="shrink-0 text-gray-500 hover:text-red-600 p-1"
            title="Delete"
          >
            <BookX className="w-4 h-4" />
          </button>
        </div>
        {isExpanded && hasChildren && (
          <div>{children.map((child) => renderFolder(child, level + 1))}</div>
        )}
      </div>
    );
  };

  const rootFolders = buildTree(null);

  return (
    <div className="h-full overflow-y-auto">
      {/* <div className="p-4">
        <button
          onClick={() => onCreateFolder(null)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + New Collection
        </button>
      </div> */}
      <div
        className={`py-2 px-3 cursor-pointer hover:bg-gray-100 ${
          selectedCollectionId === null
            ? "bg-blue-50 border-l-4 border-blue-600"
            : ""
        }`}
        onClick={() => onSelectCollection(null)}
      >
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium py-2">All Documents</span>
        </div>
      </div>
      <div className="py-3">
        <span className="font-almendra font-bold text-xl">Collections</span>
      </div>

      {rootFolders.map((folder) => renderFolder(folder))}
    </div>
  );
}
