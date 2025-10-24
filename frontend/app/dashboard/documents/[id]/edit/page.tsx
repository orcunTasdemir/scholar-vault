"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Document } from "@/lib/api";

export default function EditDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [journal, setJournal] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!token) return;

      try {
        const doc = await api.getDocument(token, documentId);
        setDocument(doc);
        setTitle(doc.title || "");
        setAuthors(doc.authors?.join(" ") || "");
        setYear(doc.year?.toString() || "");
        setJournal(doc.journal || "");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load document"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocument();
  }, [token, documentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setError("");

    try {
      const updates = {
        title,
        authors: authors ? authors.split(",").map((a) => a.trim()) : null,
        year: year ? parseInt(year) : null,
        journal: journal || null,
      };

      await api.updateDocument(token, documentId, updates);
      // Redirect back to document detail page on success
      router.push(`/dashboard/documents/${documentId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update document"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || "Document not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push(`/dashboard/documents/${documentId}`)}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Document
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Document</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Authors field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Authors (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    placeholder="John Doe, Jane Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* ADD THIS NEW SECTION - Journal field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Journal
                  </label>
                  <input
                    type="text"
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    placeholder="Nature, Science, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </main>
          <p className="text-sm text-gray-600 mt-2">
            Authors: {document.authors?.join(", ") || "None"}
          </p>
        </div>
      </main>
    </div>
  );
}
