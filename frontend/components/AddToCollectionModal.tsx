"use client";

import { Collection } from "@/lib/api";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface AddToCollectionDropdownProps {
  collections: Collection[];
  onSelect: (collectionId: string) => void;
}

export function AddToCollectionDropdown({
  collections,
  onSelect,
}: AddToCollectionDropdownProps) {
  if (collections.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-gray-600">
        No collections yet. Create one using the sidebar.
      </div>
    );
  }

  return (
    <div className="py-1">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
        Add to Collection
      </div>
      {collections.map((collection) => (
        <DropdownMenuItem
          key={collection.id}
          onClick={() => onSelect(collection.id)}
          className="cursor-pointer"
        >
          <span className="mr-2">📁</span>
          <span>{collection.name}</span>
        </DropdownMenuItem>
      ))}
    </div>
  );
}
