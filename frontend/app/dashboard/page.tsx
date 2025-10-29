"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Document, Collection } from "@/lib/api";
import Image from "next/image";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
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

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, logout } = useAuth();

  // Document state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "extracting" | "success"
  >("idle");

  // Collection state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);
  const [collectionDocuments, setCollectionDocuments] = useState<Document[]>(
    []
  );
  const [isLoadingCollectionDocs, setIsLoadingCollectionDocs] = useState(false);

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

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!token) return;

      try {
        const docs = await api.getDocuments(token);
        setDocuments(docs);
        console.log("📄 Fetched documents:", documents);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && token) {
      fetchDocuments();
    }
  }, [user, token]);

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      if (!token) return;

      try {
        const cols = await api.getCollections(token);
        setCollections(cols);
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      }
    };

    fetchCollections();
  }, [token]);

  // Fetch collection documents when collection is selected
  useEffect(() => {
    const fetchCollectionDocuments = async () => {
      if (!token || selectedCollectionId === null) {
        setCollectionDocuments([]);
        return;
      }

      setIsLoadingCollectionDocs(true);
      try {
        const docs = await api.getCollectionDocuments(
          token,
          selectedCollectionId
        );
        setCollectionDocuments(docs);
      } catch (error) {
        console.error("Failed to fetch collection documents:", error);
      } finally {
        setIsLoadingCollectionDocs(false);
      }
    };

    fetchCollectionDocuments();
  }, [selectedCollectionId, token]);

  if (!user) {
    return null;
  }

  // Get displayed documents based on selection
  const displayedDocuments =
    selectedCollectionId === null ? documents : collectionDocuments;

  // console.log("🔍 DEBUG INFO:");
  // console.log("  - documents:", documents);
  // console.log("  - documents.length:", documents.length);
  // console.log("  - displayedDocuments:", displayedDocuments);
  // console.log("  - displayedDocuments.length:", displayedDocuments.length);
  // console.log("  - isLoading:", isLoading);
  // console.log("  - selectedCollectionId:", selectedCollectionId);

  const selectedCollection = collections.find(
    (c) => c.id === selectedCollectionId
  );

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
      const response = await fetch(
        "http://10.0.0.57:3000/api/documents/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

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
    if (!token) return;

    try {
      const newCollection = await api.createCollection(token, name, null);
      setCollections((prev) => [...prev, newCollection]);
    } catch (error) {
      console.error("Failed to create folder:", error);
      alert("Failed to create folder");
    }
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
    if (!token || !folderToRename) return;

    try {
      const updatedCollection = await api.updateCollection(
        token,
        folderToRename.id,
        {
          name: newName,
        }
      );
      setCollections((prev) =>
        prev.map((c) => (c.id === folderToRename.id ? updatedCollection : c))
      );
    } catch (error) {
      console.error("Failed to rename folder:", error);
      alert("Failed to rename folder");
    }
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
    if (!token || !folderToDelete) return;

    try {
      await api.deleteCollection(token, folderToDelete.id);
      setCollections((prev) => prev.filter((c) => c.id !== folderToDelete.id));
      if (selectedCollectionId === folderToDelete.id) {
        setSelectedCollectionId(null);
      }
    } catch (error) {
      console.error("Failed to delete folder:", error);
      alert("Failed to delete folder");
    }
  };

  // Handler: Select collection
  const handleSelectCollection = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId);
  };

  // Handler: Add to collection
  const handleAddToCollection = async (
    documentId: string,
    collectionId: string
  ) => {
    if (!token) return;

    try {
      await api.addDocumentToCollection(token, collectionId, documentId);

      if (selectedCollectionId === collectionId) {
        const docs = await api.getCollectionDocuments(token, collectionId);
        setCollectionDocuments(docs);
      }
    } catch (error) {
      console.error("Failed to add document to collection:", error);
      alert("Failed to add document to collection");
    }
  };

  // Handler: Remove from collection
  const handleRemoveFromCollection = async (
    e: React.MouseEvent,
    documentId: string
  ) => {
    e.stopPropagation();

    if (!selectedCollectionId || !token) return;

    const collectionName = collections.find(
      (c) => c.id === selectedCollectionId
    )?.name;

    if (
      !window.confirm(
        `Remove this document from "${collectionName}"? The document will still exist in "All Documents".`
      )
    ) {
      return;
    }

    try {
      await api.removeDocumentFromCollection(
        token,
        selectedCollectionId,
        documentId
      );
      setCollectionDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentId)
      );
    } catch (error) {
      console.error("Remove from collection error:", error);
      alert("Failed to remove document from collection");
    }
  };

  // Handler: Delete document
  const handleDeleteDocument = async (
    e: React.MouseEvent,
    documentId: string
  ) => {
    e.stopPropagation();

    if (
      !window.confirm(
        "Are you sure you want to delete this document permanently?"
      )
    ) {
      return;
    }

    if (!token) return;

    try {
      await api.deleteDocument(token, documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      setCollectionDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentId)
      );
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete document");
    }
  };

  console.log("🎨 RENDER - Component state:");
  console.log("  - documents:", documents);
  console.log("  - documents.length:", documents.length);
  console.log("  - isLoading:", isLoading);
  console.log("  - user:", user);
  console.log("  - token:", !!token);
  return (
    <SidebarProvider defaultOpen={true} className="flex flex-col">
      {/* Unified Header */}
      <AppHeader
        user={user}
        onUploadClick={() => document.getElementById("file-upload")?.click()}
        onCreateFolder={() => setCreateFolderOpen(true)}
        onLogout={logout}
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
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold font-display">
                {selectedCollection?.name || "All Documents"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
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
              <div className="mb-4 p-4 bg-red-50 border-red-200 rounded-lg text-red-700">
                {uploadError}
              </div>
            )}

            {/* Upload Status */}
            {uploadStatus !== "idle" && (
              <div className="mb-4 p-4 bg-blue-50 border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-blue-700">
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
              isLoading={
                selectedCollectionId ? isLoadingCollectionDocs : isLoading
              }
              onAddToCollection={handleAddToCollection}
              onRemoveFromCollection={handleRemoveFromCollection}
              onDelete={handleDeleteDocument}
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
