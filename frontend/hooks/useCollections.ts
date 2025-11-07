import { useState, useEffect } from "react";
import { api, Collection, Document } from "@/lib/api";
import { toast } from "sonner";

export function useCollections(token: string | null) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [collectionDocuments, setCollectionDocuments] = useState<Document[]>([]);
  const [isLoadingCollectionDocs, setIsLoadingCollectionDocs] = useState(false);

  // Fetch all collections
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
        const docs = await api.getCollectionDocuments(token, selectedCollectionId);
        setCollectionDocuments(docs);
      } catch (error) {
        console.error("Failed to fetch collection documents:", error);
      } finally {
        setIsLoadingCollectionDocs(false);
      }
    };

    fetchCollectionDocuments();
  }, [selectedCollectionId, token]);

  const createCollection = async (name: string) => {
    if (!token) return;

    try {
      const newCollection = await api.createCollection(token, name, null);
      setCollections((prev) => [...prev, newCollection]);
      toast.success(`Collection "${name}" created`);
      return newCollection;
    } catch (error) {
      console.error("Failed to create folder:", error);
      toast.error("Failed to create collection");
      throw error;
    }
  };

  const updateCollection = async (collectionId: string, newName: string) => {
    if (!token) return;

    try {
      const updatedCollection = await api.updateCollection(token, collectionId, {
        name: newName,
      });
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? updatedCollection : c))
      );
      toast.success(`Collection renamed to "${newName}"`);
      return updatedCollection;
    } catch (error) {
      console.error("Failed to rename folder:", error);
      toast.error("Failed to rename collection");
      throw error;
    }
  };

  const deleteCollection = async (collectionId: string, collectionName: string) => {
    if (!token) return;

    try {
      await api.deleteCollection(token, collectionId);
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
      if (selectedCollectionId === collectionId) {
        setSelectedCollectionId(null);
      }
      toast.success(`Collection "${collectionName}" deleted`);
      return true;
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast.error("Failed to delete collection");
      throw error;
    }
  };

  const addDocumentToCollection = async (collectionId: string, documentId: string) => {
    if (!token) return;

    try {
      await api.addDocumentToCollection(token, collectionId, documentId);

      const collection = collections.find((c) => c.id === collectionId);
      if (collection) {
        toast.success(`Successfully added to "${collection.name}"`);
      }

      if (selectedCollectionId === collectionId) {
        const docs = await api.getCollectionDocuments(token, collectionId);
        setCollectionDocuments(docs);
      }
      return true;
    } catch (error) {
      console.error("Failed to add document to collection:", error);
      toast.error("Failed to add document to collection");
      throw error;
    }
  };

  const removeDocumentFromCollection = async (documentId: string) => {
    if (!selectedCollectionId || !token) return;

    try {
      await api.removeDocumentFromCollection(token, selectedCollectionId, documentId);
      setCollectionDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      toast.success("Document removed from collection");
      return true;
    } catch (error) {
      console.error("Remove from collection error:", error);
      toast.error("Failed to remove document from collection");
      throw error;
    }
  };

  const selectCollection = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId);
  };

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  return {
    collections,
    selectedCollectionId,
    selectedCollection,
    collectionDocuments,
    isLoadingCollectionDocs,
    setCollectionDocuments,
    createCollection,
    updateCollection,
    deleteCollection,
    addDocumentToCollection,
    removeDocumentFromCollection,
    selectCollection,
  };
}
