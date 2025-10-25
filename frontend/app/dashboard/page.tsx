"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Document } from "@/lib/api";
import Image from "next/image";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();

  // Document uploads
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

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
    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        "http://localhost:3000/api/documents/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
      if (!response.ok) {
        // Try to get the error message from the response
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error || `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }
      const newDocument = await response.json();
      setDocuments((prev) => [...prev, newDocument]);

      // Reset
      event.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload PDF"
      );
    } finally {
      setIsUploading(false);
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 ls:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ScholarVault Logo"
              width={48}
              height={48}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ScholarVault</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user.username}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              My Documents
            </h2>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer inline-block transition-colors shadow-sm hover:shadow">
              {isUploading ? "⏳ Uploading..." : "📤 Upload PDF"}
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {uploadError && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {uploadError}
            </div>
          )}

          {documents.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
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
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all bg-white"
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
