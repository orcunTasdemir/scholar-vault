"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Document } from "@/lib/api";

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
        throw new Error("Upload failed");
      }
      const newDocument = await response.json();
      setDocuments((prev) => [...prev, newDocument]);

      // Reset
      event.target.value = "";
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload PDF"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 ls:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ScholarVault</h1>
            <p className="text-sm text-gray-600">
              Welcome back, {user.username}
            </p>
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
            <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer inline-block">
              {isUploading ? "Uploading..." : "+ Upload PDF"}
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
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No documents yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first research document.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <h3 className="font-medium text-gray-900">{doc.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
