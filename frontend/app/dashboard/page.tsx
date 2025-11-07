"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Collection, SearchResult } from "@/lib/api";
import Image from "next/image";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import AppHeader from "@/components/layout/AppHeader";
import { FolderTree } from "@/components/FolderTree";
import { DocumentGrid } from "@/components/documents/DocumentGrid";
import { CreateFolderDialog } from "@/components/dialog/CreateFolderDialog";
import { RenameFolderDialog } from "@/components/dialog/RenameFolderDialog";
import { DeleteConfirmDialog } from "@/components/dialog/DeleteConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileUp } from "lucide-react";
import { toast } from "sonner";
import { useDocuments } from "@/hooks/useDocuments";
import { useCollections } from "@/hooks/useCollections";
import { useSearch } from "@/hooks/useSearch";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.53:3000";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, logout } = useAuth();

  // Custom hooks
  const {
    documents,
    isLoading,
    setDocuments,
    deleteDocument: deleteDoc,
  } = useDocuments(token, user);
  const {
    collections,
    selectedCollectionId,
    selectedCollection,
    collectionDocuments,
    isLoadingCollectionDocs,
    setCollectionDocuments,
    createCollection,
    updateCollection,
    deleteCollection,
    addDocumentToCollection: addToCollection,
    removeDocumentFromCollection: removeFromCollection,
    selectCollection,
  } = useCollections(token);
  const {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
  } = useSearch(token);

  // Upload state
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "extracting" | "success"
  >("idle");

  // Dialog state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Collection | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Collection | null>(null);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Handle subscription success/cancel query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Subscription activated! Welcome aboard.");
      window.history.replaceState({}, "", "/dashboard");
    }
    if (params.get("canceled") === "true") {
      toast.info("Checkout cancelled. You can subscribe anytime.");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  if (!user) {
    return null;
  }

  const displayedDocuments = isSearching
    ? searchResults
    : selectedCollectionId === null
    ? documents
    : collectionDocuments;

  // Handler: Upload PDF
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    setUploadStatus("uploading");
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error || `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      setUploadStatus("extracting");
      const newDocument = await response.json();

      // If viewing a collection, add document to it
      if (selectedCollectionId && token) {
        try {
          await api.addDocumentToCollection(
            token,
            selectedCollectionId,
            newDocument.id
          );
          const docs = await api.getCollectionDocuments(
            token,
            selectedCollectionId
          );
          setCollectionDocuments(docs);
        } catch (error) {
          console.error("Failed to add document to collection:", error);
        }
      }

      setUploadStatus("success");
      await new Promise((resolve) => setTimeout(resolve, 800));

      setDocuments((prev) => [...prev, newDocument]);
      event.target.value = "";
      setUploadStatus("idle");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload PDF"
      );
      setUploadStatus("idle");
    }
  };

  // Handler: Create folder
  const handleCreateFolder = async (name: string) => {
    await createCollection(name);
  };

  // Handler: Rename folder (open dialog)
  const handleRenameFolder = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (collection) {
      setFolderToRename(collection);
      setRenameFolderOpen(true);
    }
  };

  // Handler: Confirm rename
  const handleConfirmRename = async (newName: string) => {
    if (!folderToRename) return;
    await updateCollection(folderToRename.id, newName);
  };

  // Handler: Delete folder (open dialog)
  const handleDeleteFolder = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (collection) {
      setFolderToDelete(collection);
      setDeleteFolderOpen(true);
    }
  };

  // Handler: Confirm delete
  const handleConfirmDelete = async () => {
    if (!folderToDelete) return;
    await deleteCollection(folderToDelete.id, folderToDelete.name);
  };

  // Handler: Select collection
  const handleSelectCollection = (collectionId: string | null) => {
    selectCollection(collectionId);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  // Handler: Add to collection
  const handleAddToCollection = async (
    documentId: string,
    collectionId: string
  ) => {
    await addToCollection(collectionId, documentId);
  };

  // Handler: Remove from collection
  const handleRemoveFromCollection = async (documentId: string) => {
    await removeFromCollection(documentId);
  };

  // Handler: Delete document
  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDoc(documentId);
      setCollectionDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentId)
      );
      toast.success("Document deleted permanently");
    } catch {
      toast.error("Failed to delete document");
    }
  };

  return (
    <SidebarProvider defaultOpen={true} className="flex flex-col">
      {/* Unified Header */}
      <AppHeader
        user={user}
        onUploadClick={() => document.getElementById("file-upload")?.click()}
        onCreateFolder={() => setCreateFolderOpen(true)}
        onSearch={handleSearch}
        onLogout={logout}
        selectedCollectionId={selectedCollectionId}
        selectedCollectionName={selectedCollection?.name}
      />
      {/* Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)]">
        <AppSidebar>
          <FolderTree
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={handleSelectCollection}
            onCreateFolder={() => setCreateFolderOpen(true)}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        </AppSidebar>

        {/* Main Content */}
        <main
          className="flex-1 overflow-auto bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('/background.png')" }}
        >
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
              <h2 className="font-logo text-xl text-off-white bg-muted-teal/70 p-2 w-fit rounded-xl">
                {isSearching
                  ? `Search results for "${searchQuery}"`
                  : selectedCollection?.name || "All Documents"}
              </h2>
              <p className="text-sm text-deep-charcoal font-semibold mt-1 bg-off-white/80 px-2 py-0.5 rounded w-fit">
                {displayedDocuments.length}{" "}
                {displayedDocuments.length === 1 ? "document" : "documents"}
              </p>
            </div>

            {/* Hidden file input for upload */}
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploadStatus !== "idle"}
              className="hidden"
            />

            {/* Upload Error */}
            {uploadError && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
                {uploadError}
              </div>
            )}

            {/* Upload Status */}
            {uploadStatus !== "idle" && (
              <div className="mb-4 p-4 bg-muted-teal/10 border border-muted-teal/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-muted-teal border-t-transparent rounded-full"></div>
                  <span className="text-off-white">
                    {uploadStatus === "uploading" && "Uploading file..."}
                    {uploadStatus === "extracting" && "Extracting metadata..."}
                    {uploadStatus === "success" && "Upload complete!"}
                  </span>
                </div>
              </div>
            )}

            {/* Document Grid */}
            <DocumentGrid
              documents={displayedDocuments}
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              selectedCollectionName={selectedCollection?.name || null}
              isLoading={
                selectedCollectionId ? isLoadingCollectionDocs : isLoading
              }
              onAddToCollection={handleAddToCollection}
              onRemoveFromCollection={handleRemoveFromCollection}
              onDelete={handleDeleteDocument}
              searchResults={isSearching ? searchResults : undefined}
            />
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onConfirm={handleCreateFolder}
      />

      <RenameFolderDialog
        open={renameFolderOpen}
        onOpenChange={setRenameFolderOpen}
        onConfirm={handleConfirmRename}
        currentName={folderToRename?.name || ""}
      />

      <DeleteConfirmDialog
        open={deleteFolderOpen}
        onOpenChange={setDeleteFolderOpen}
        onConfirm={handleConfirmDelete}
        title={`Delete "${folderToDelete?.name}"?`}
        description="This will permanently delete this collection and all its subfolders. Documents will not be deleted."
      />
    </SidebarProvider>
  );
}
