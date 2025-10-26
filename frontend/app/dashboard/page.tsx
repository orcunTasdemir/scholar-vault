"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Document } from "@/lib/api";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();

  // Document uploads
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "extracting" | "success"
  >("idle");

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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

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

    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    if (!token) return;

    try {
      await api.deleteDocument(token, documentId);
      // remove from local state
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete document");
    }
  };

  return (
    <div className="min-h-screen ">
      <header className="backdrop-blur-xs sticky top-0 left-0 right-0 border-none bg-linear-to-t from-amber-50/0 to-orange-800/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
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
              <p className="text-sm text-gray-900 font-bold font-almendra">
                Welcome back, {user.username || user.email}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                {user.profile_image_url ? (
                  <Image
                    src={`http://10.0.0.57:3000/${user.profile_image_url}`}
                    alt={user.username || "User"}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {(user.username || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                {/* <span className="text-sm font-medium text-gray-700">
                  {user.username || user.email.split("@")[0]}
                </span> */}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  {user.profile_image_url ? (
                    <Image
                      src={`http://10.0.0.57:3000/${user.profile_image_url}`}
                      alt={user.username || "User"}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {(user.username || user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {user.username || "User"}
                    </span>
                    <span className="text-xs font-normal text-gray-500">
                      {user.email}
                    </span>
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
              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className=" rounded-lg shadow p-6 bg-gray-100/30">
          <div className="mb-6 ">
            <div className="flex justify-between items-center mb-2 ">
              <h2 className="text-xl font-semibold text-gray-900">
                My Documents
              </h2>
              <label
                className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 inline-block transition-colors shadow-sm ${
                  uploadStatus === "idle"
                    ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer hover:shadow"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                {uploadStatus === "uploading" && "📤 Uploading file..."}
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
            </div>

            {/* Upload Status Message - Now OUTSIDE flex container */}
            {uploadStatus !== "idle" && (
              <div className="text-sm text-gray-600">
                {uploadStatus === "uploading" && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Uploading file to server...</span>
                  </div>
                )}
                {uploadStatus === "extracting" && (
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse h-4 w-4 bg-blue-600 rounded-full"></div>
                    <span>
                      AI is extracting metadata (title, authors, DOI, etc.)...
                    </span>
                  </div>
                )}
                {uploadStatus === "success" && (
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="text-lg">✓</span>
                    <span>Successfully added to your library!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {uploadError}
            </div>
          )}

          {documents.length === 0 ? (
            <div className="text-center py-16  rounded-lg border-2 border-dashed border-gray-300">
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
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all "
                >
                  <div
                    onClick={() =>
                      router.push(`/dashboard/documents/${doc.id}`)
                    }
                    className="cursor-pointer"
                  >
                    <h3 className="font-semibold text-gray-900">{doc.title}</h3>
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
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/documents/${doc.id}`);
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => handleDeleteDocument(e, doc.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
