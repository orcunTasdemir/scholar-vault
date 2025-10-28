"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Document } from "@/lib/api";
import Image from "next/image";
import { FolderTree } from "@/components/FolderTree";
import { Collection } from "@/lib/api";
import { AddToCollectionDropdown } from "@/components/AddToCollectionModal";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();

  // Document uploads
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "extracting" | "success"
  >("idle");

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);
  const [collectionDocuments, setCollectionDocuments] = useState<Document[]>(
    []
  );
  const [isLoadingCollectionDocs, setIsLoadingCollectionDocs] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!token) return;

      try {
        const docs = await api.getDocuments(token);
        setDocuments(docs);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      }
    };

    if (user && token) {
      fetchDocuments();
    }
  }, [user, token]);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!token) return;

      try {
        const cols = await api.getCollections(token);
        setCollections(cols);
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      } finally {
        setIsLoadingCollections(false);
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
        setCollectionDocuments([]);
      } finally {
        setIsLoadingCollectionDocs(false);
      }
    };

    fetchCollectionDocuments();
  }, [selectedCollectionId, token]);

  const displayedDocuments =
    selectedCollectionId === null ? documents : collectionDocuments;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 ">Loading...</div>
      </div>
    );
  }
  if (!user) {
    return null;
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    // Validate file type
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setUploadError("Please upload a PDF file only");
      event.target.value = "";
      return;
    }

    // Validate file size (100MB = 100 * 1024 * 1024 bytes)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(
        `File is too large. Maximum size is 100MB (your file: ${(
          file.size /
          1024 /
          1024
        ).toFixed(1)}MB)`
      );
      event.target.value = "";
      return;
    }

    setUploadStatus("uploading");
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadStartTime = Date.now();

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

      // Once upload is complete, show extracting status
      const uploadDuration = Date.now() - uploadStartTime;
      // If upload took less than 1 second, show extracting briefly
      if (uploadDuration < 1000) {
        setUploadStatus("extracting");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error || `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const newDocument = await response.json();

      // If we're viewing a collection, add the document to it
      if (selectedCollectionId && token) {
        try {
          await api.addDocumentToCollection(
            token,
            selectedCollectionId,
            newDocument.id
          );
          // Refresh collection documents
          const docs = await api.getCollectionDocuments(
            token,
            selectedCollectionId
          );
          setCollectionDocuments(docs);
        } catch (error) {
          console.error("Failed to add document to collection:", error);
          // Still show success for upload, just log the collection add error
        }
      }

      // Show success briefly
      setUploadStatus("success");
      await new Promise((resolve) => setTimeout(resolve, 800));

      setDocuments((prev) => [...prev, newDocument]);

      // Reset
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

  const handleDeleteDocument = async (
    e: React.MouseEvent,
    documentId: string
  ) => {
    e.stopPropagation(); // prevent click when deleting

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
      // Remove from all local state
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      setCollectionDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentId)
      );
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete document");
    }
  };

  const handleRemoveFromCollection = async (
    e: React.MouseEvent,
    documentId: string
  ) => {
    e.stopPropagation(); // prevent click when removing

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
      // Remove from collection documents only
      setCollectionDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentId)
      );
    } catch (error) {
      console.error("Remove from collection error:", error);
      alert("Failed to remove document from collection");
    }
  };

  const handleCreateFolder = async (parentId: string | null) => {
    if (!token) return;

    const folderName = prompt("Enter folder name:");
    if (!folderName) return;

    try {
      const newCollection = await api.createCollection(
        token,
        folderName,
        parentId
      );
      setCollections((prev) => [...prev, newCollection]);
    } catch (error) {
      console.error("Failed to create folder:", error);
      alert("Failed to create folder");
    }
  };

  const handleRenameFolder = async (collectionId: string) => {
    if (!token) return;

    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;

    const newName = prompt("Enter new folder name:", collection.name);
    if (!newName || newName === collection.name) return;

    try {
      const updatedCollection = await api.updateCollection(
        token,
        collectionId,
        { name: newName }
      );
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? updatedCollection : c))
      );
    } catch (error) {
      console.error("Failed to rename folder:", error);
      alert("Failed to rename folder");
    }
  };

  const handleDeleteFolder = async (collectionId: string) => {
    if (!token) return;

    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return;

    if (
      !window.confirm(
        `Delete folder "${collection.name}"? This will also delete all subfolders.`
      )
    ) {
      return;
    }

    try {
      await api.deleteCollection(token, collectionId);
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
      if (selectedCollectionId === collectionId) {
        setSelectedCollectionId(null);
      }
    } catch (error) {
      console.error("Failed to delete folder:", error);
      alert("Failed to delete folder");
    }
  };

  const handleSelectCollection = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId);
  };

  const handleAddToCollection = async (
    documentId: string,
    collectionId: string
  ) => {
    if (!token) return;

    try {
      await api.addDocumentToCollection(token, collectionId, documentId);

      // Refresh collection documents if viewing that collection
      if (selectedCollectionId === collectionId) {
        const docs = await api.getCollectionDocuments(token, collectionId);
        setCollectionDocuments(docs);
      }
    } catch (error) {
      console.error("Failed to add document to collection:", error);
      alert("Failed to add document to collection");
    }
  };

  return (
    <div className="min-h-screen flex ">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar isCollapsed={isSidebarCollapsed}>
          <FolderTree
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={handleSelectCollection}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        </AppSidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="shadow-sm sticky top-0 z-50 backdrop-blur-md">
            <div className="flex items-center justify-between w-full px-8 py-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger
                  className="scale-150"
                  onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                />

                <Image
                  src="/logo.png"
                  alt="ScholarVault Logo"
                  width={48}
                  height={48}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 font-almendra">
                    ScholarVault
                  </h1>
                  <p className="text-sm text-gray-600 font-almendra font-bold">
                    Welcome back, {user?.username || user?.email.split("@")[0]}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {user?.profile_image_url ? (
                      <Image
                        src={`http://10.0.0.57:3000/${user.profile_image_url}`}
                        alt={user?.username || "User"}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {(user?.username || user?.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium">
                      {user?.username || user?.email.split("@")[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-gray-100/70"
                >
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3">
                      {user?.profile_image_url ? (
                        <Image
                          src={`http://10.0.0.57:3000/${user.profile_image_url}`}
                          alt={user?.username || "User"}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {(user?.username || user?.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {user?.username || user?.email.split("@")[0]}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/profile")}
                  >
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 focus:text-red-600"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content Area */}
          <main className=" flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedCollectionId === null
                  ? "All Documents"
                  : collections.find((c) => c.id === selectedCollectionId)
                      ?.name || "Documents"}
              </h2>

              <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer inline-block transition-colors shadow-sm hover:shadow">
                {uploadStatus === "uploading" && "⏳ Uploading file..."}
                {uploadStatus === "extracting" && "🤖 Extracting metadata..."}
                {uploadStatus === "success" && "✅ Upload complete!"}
                {uploadStatus === "idle" && "📤 Upload PDF"}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={uploadStatus !== "idle"}
                  className="hidden"
                />
              </label>

              {uploadError && (
                <p className="mt-2 text-sm text-red-600">{uploadError}</p>
              )}
            </div>

            {(selectedCollectionId ? isLoadingCollectionDocs : isLoading) ? (
              <p className="text-gray-600">Loading documents...</p>
            ) : displayedDocuments.length === 0 ? (
              <div className="text-center py-16 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-300">
                <Image
                  src="/logo.png"
                  alt="No documents"
                  width={64}
                  height={64}
                  className="mx-auto opacity-50"
                />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No documents yet
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Get started by uploading your first research document.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  We&apos;ll automatically extract metadata from your PDFs!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div
                      onClick={() =>
                        router.push(`/dashboard/documents/${doc.id}`)
                      }
                      className="cursor-pointer"
                    >
                      <h3 className="font-semibold text-gray-900">
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>
                          📅 {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        {doc.authors && doc.authors.length > 0 && (
                          <span>
                            👤 {doc.authors[0]}
                            {doc.authors.length > 1
                              ? ` +${doc.authors.length - 1}`
                              : ""}
                          </span>
                        )}
                        {doc.year && <span>🗓️ {doc.year}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/documents/${doc.id}`)
                        }
                        className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View
                      </button>

                      {selectedCollectionId === null ? (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                + Collection
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <AddToCollectionDropdown
                                collections={collections}
                                onSelect={(collectionId) =>
                                  handleAddToCollection(doc.id, collectionId)
                                }
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <button
                            onClick={(e) => handleDeleteDocument(e, doc.id)}
                            className="flex-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) =>
                              handleRemoveFromCollection(e, doc.id)
                            }
                            className="flex-1 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                          >
                            Remove
                          </button>
                          <button
                            onClick={(e) => handleDeleteDocument(e, doc.id)}
                            className="flex-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
