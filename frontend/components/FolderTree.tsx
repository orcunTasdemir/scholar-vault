"use client";

import { useState } from "react";
import { Collection } from "@/lib/api";

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
      <div key={collection.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-gray-100 ${
            isSelected ? "bg-blue-50 border-l-4 border-blue-600" : ""
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => onSelectCollection(collection.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(collection.id);
              }}
              className="w-4 h-4 flex items-center justify-center text-gray-600"
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          {!hasChildren && <span className="w-4" />}
          <span className="mr-2">{isExpanded ? "📂" : "📁"}</span>
          <span className="flex-1 text-sm">{collection.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRenameFolder(collection.id);
            }}
            className="text-xs text-gray-500 hover:text-gray-700 p-1"
            title="Rename"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(collection.id);
            }}
            className="text-xs text-gray-500 hover:text-red-600 p-1"
            title="Delete"
          >
            🗑️
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
    <div className="w-64 h-full overflow-y-auto">
      <div className="p-4">
        {/* <h2 className="font-semibold text-gray-900">Collections</h2> */}
        <button
          onClick={() => onCreateFolder(null)}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          + New Folder
        </button>
      </div>
      <div
        className={`py-2 px-3 cursor-pointer hover:bg-gray-100 ${
          selectedCollectionId === null ? "border-l-4 border-blue-600" : ""
        }`}
        onClick={() => onSelectCollection(null)}
      >
        <span className="mr-2">📚</span>
        <span className="text-sm">All Documents</span>
      </div>
      {rootFolders.map((folder) => renderFolder(folder))}
    </div>
  );
}
