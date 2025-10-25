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
  const [publicationType, setPublicationType] = useState("");
  const [volume, setVolume] = useState("");
  const [issue, setIssue] = useState("");
  const [pages, setPages] = useState("");
  const [publisher, setPublisher] = useState("");
  const [doi, setDoi] = useState("");
  const [url, setUrl] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

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
        setPublicationType(doc.publication_type || "");
        setVolume(doc.volume || "");
        setIssue(doc.issue || "");
        setPages(doc.pages || "");
        setPublisher(doc.publisher || "");
        setDoi(doc.doi || "");
        setUrl(doc.url || "");
        setAbstract(doc.abstract_text || "");
        setKeywords(doc.keywords?.join(", ") || "");
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

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Title is required
    if (!title.trim()) {
      errors.title = "Title is required";
    }

    // Year validation (if provided)
    if (year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum)) {
        errors.year = "Year must be a number";
      } else if (yearNum < 1900 || yearNum > 2100) {
        errors.year = "Year must be between 1900 and 2100";
      }
    }

    // DOI format validation (basic)
    if (doi && !doi.match(/^10\.\d{4,}/)) {
      errors.doi = "DOI should start with 10. followed by numbers";
    }

    // URL validation (basic)
    if (url && !url.match(/^https?:\/\/.+/)) {
      errors.url = "URL should start with http:// or https://";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const updates: Partial<Document> = {
        title,
        authors: authors ? authors.split(",").map((a) => a.trim()) : null,
        year: year ? parseInt(year) : null,
        publication_type: publicationType || null,
        journal: journal || null,
        volume: volume || null,
        issue: issue || null,
        pages: pages || null,
        publisher: publisher || null,
        doi: doi || null,
        url: url || null,
        abstract_text: abstract || null,
        keywords: keywords ? keywords.split(",").map((k) => k.trim()) : null,
      };

      await api.updateDocument(token, documentId, updates);
      router.push(`/dashboard/documents/${documentId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update document"
      );
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
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
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}
                {/* Basic Information Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                    Basic Information
                  </h2>
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Authors and Year in 2 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          min="1900"
                          max="2100"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.year
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {validationErrors.year && (
                          <p className="text-red-500 text-sm mt-1">
                            {validationErrors.year}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Publication Details Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                    Publication Details
                  </h2>
                  <div className="space-y-4">
                    {/* Journal and Publication Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Publication Type
                        </label>
                        <input
                          type="text"
                          value={publicationType}
                          onChange={(e) => setPublicationType(e.target.value)}
                          placeholder="Journal Article, Conference Paper"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Volume, Issue, Pages in 3 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Volume
                        </label>
                        <input
                          type="text"
                          value={volume}
                          onChange={(e) => setVolume(e.target.value)}
                          placeholder="42"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issue
                        </label>
                        <input
                          type="text"
                          value={issue}
                          onChange={(e) => setIssue(e.target.value)}
                          placeholder="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pages
                        </label>
                        <input
                          type="text"
                          value={pages}
                          onChange={(e) => setPages(e.target.value)}
                          placeholder="123-145"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Publisher */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Publisher
                      </label>
                      <input
                        type="text"
                        value={publisher}
                        onChange={(e) => setPublisher(e.target.value)}
                        placeholder="Springer, Elsevier, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Identifiers Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                    Identifiers
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DOI
                      </label>
                      <input
                        type="text"
                        value={doi}
                        onChange={(e) => setDoi(e.target.value)}
                        placeholder="10.1234/example"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.doi
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {validationErrors.doi && (
                        <p className="text-red-500 text-sm mt-1">
                          {validationErrors.doi}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com/paper"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.url
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {validationErrors.url && (
                        <p className="text-red-500 text-sm mt-1">
                          {validationErrors.url}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                    Content
                  </h2>
                  <div className="space-y-4">
                    {/* Keywords */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keywords (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="machine learning, neural networks"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Abstract */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Abstract
                      </label>
                      <textarea
                        value={abstract}
                        onChange={(e) => setAbstract(e.target.value)}
                        rows={8}
                        placeholder="Enter the abstract text..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {abstract.length} characters
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/dashboard/documents/${documentId}`)
                    }
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </main>
    </div>
  );
}
