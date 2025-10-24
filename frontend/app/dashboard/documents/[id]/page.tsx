"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api, Document } from "@/lib/api";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const documentId = params.id as string;

  useEffect(() => {
    const fetchDocument = async () => {
      if (!token) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/documents/${documentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }
        const data = await response.json();
        setDocument(data);
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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authors */}
            {document.authors && document.authors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authors
                </label>
                <p className="text-gray-900">{document.authors.join(", ")}</p>
              </div>
            )}

            {/* Year */}
            {document.year && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <p className="text-gray-900">{document.year}</p>
              </div>
            )}

            {/* Publication Type */}
            {document.publication_type && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publication Type
                </label>
                <p className="text-gray-900">{document.publication_type}</p>
              </div>
            )}

            {/* Journal */}
            {document.journal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Journal
                </label>
                <p className="text-gray-900">{document.journal}</p>
              </div>
            )}

            {/* DOI */}
            {document.doi && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DOI
                </label>
                <p className="text-gray-900">{document.doi}</p>
              </div>
            )}

            {/* URL */}
            {document.url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <a
                  href={document.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {document.url}
                </a>
              </div>
            )}
          </div>

          {/* Abstract */}
          {document.abstract_text && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abstract
              </label>
              <p className="text-gray-900 whitespace-pre-wrap">
                {document.abstract_text}
              </p>
            </div>
          )}

          {/* PDF Download Button */}
          {document.pdf_url && (
            <div className="mt-6">
              <a
                href={`${API_BASE_URL}/${document.pdf_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View PDF
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
