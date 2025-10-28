"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useRouter } from "next/navigation";

interface AppMenubarProps {
  // Context-aware props
  selectedCollectionId: string | null;
  selectedDocuments: string[]; // Array of selected document IDs
  collectionName?: string;

  // Action handlers
  onUploadPDF: () => void;
  onCreateFolder: () => void;
  onRenameFolder: () => void;
  onDeleteFolder: () => void;
  onToggleSidebar: () => void;
  onDeleteDocuments: () => void;
  onAddToCollection: () => void;
  onExport: () => void;
}

export function AppMenubar({
  selectedCollectionId,
  selectedDocuments,
  collectionName,
  onUploadPDF,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleSidebar,
  onDeleteDocuments,
  onAddToCollection,
  onExport,
}: AppMenubarProps) {
  const router = useRouter();
  const hasSelection = selectedDocuments.length > 0;
  const isInCollection = selectedCollectionId !== null;

  return (
    <Menubar className="rounded-none border-b border-border h-12 px-4 font-almendra">
      {/* FILE MENU */}
      <MenubarMenu>
        <MenubarTrigger className="font-semibold">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onUploadPDF}>
            Upload PDF
            <MenubarShortcut>⌘U</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onCreateFolder}>
            New Collection
            <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onExport} disabled={!hasSelection}>
            Export Citations
            <MenubarShortcut>⌘E</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => router.push("/dashboard/profile")}>
            Settings
            <MenubarShortcut>⌘,</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* EDIT MENU */}
      <MenubarMenu>
        <MenubarTrigger className="font-semibold">Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem disabled={!hasSelection} onClick={onDeleteDocuments}>
            Delete
            <MenubarShortcut>⌘⌫</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled={!hasSelection} onClick={onAddToCollection}>
            Add to Collection
            <MenubarShortcut>⌘A</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem disabled>
            Select All
            <MenubarShortcut>⌘A</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* VIEW MENU */}
      <MenubarMenu>
        <MenubarTrigger className="font-semibold">View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onToggleSidebar}>
            Toggle Sidebar
            <MenubarShortcut>⌘B</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem disabled>
            Grid View
            <MenubarShortcut>⌘1</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            List View
            <MenubarShortcut>⌘2</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* COLLECTION MENU - Context-aware, only shows when in a collection */}
      {isInCollection && (
        <MenubarMenu>
          <MenubarTrigger className="font-semibold">Collection</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onRenameFolder}>
              Rename &quot;{collectionName}&quot;
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onDeleteFolder} className="text-red-600">
              Delete Collection
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      )}

      {/* HELP MENU */}
      <MenubarMenu>
        <MenubarTrigger className="font-semibold">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            onClick={() =>
              window.open(
                "https://github.com/orcunTasdemir/scholar-vault",
                "_blank"
              )
            }
          >
            Documentation
          </MenubarItem>
          <MenubarItem
            onClick={() =>
              window.open(
                "https://github.com/orcunTasdemir/scholar-vault",
                "_blank"
              )
            }
          >
            GitHub
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Keyboard Shortcuts
            <MenubarShortcut>⌘/</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* STATUS INFO - Right side */}
      <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
        {hasSelection && <span>{selectedDocuments.length} selected</span>}
        {isInCollection && collectionName && (
          <span className="font-semibold text-foreground">
            {collectionName}
          </span>
        )}
      </div>
    </Menubar>
  );
}
