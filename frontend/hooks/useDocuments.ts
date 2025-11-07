import { useState, useEffect } from "react";
import { api, Document } from "@/lib/api";

export function useDocuments(token: string | null, user: any) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!token) return;

      try {
        const docs = await api.getDocuments(token);
        setDocuments(docs);
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

  const deleteDocument = async (documentId: string) => {
    if (!token) return;

    try {
      await api.deleteDocument(token, documentId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  return {
    documents,
    isLoading,
    setDocuments,
    deleteDocument,
  };
}
