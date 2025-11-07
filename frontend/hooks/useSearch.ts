import { useState, useCallback } from "react";
import { api, SearchResult } from "@/lib/api";
import { toast } from "sonner";

export function useSearch(token: string | null) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(
    async (query: string, collectionId?: string | null) => {
      if (!token) return;

      setSearchQuery(query);

      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        console.log('[useSearch] Searching with query:', query, 'collectionId:', collectionId);
        const results = await api.searchDocuments(token, query, collectionId);
        console.log('[useSearch] Got results:', results.length);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error: ", error);
        toast.error("Failed to search documents");
        setSearchResults([]);
      }
    },
    [token]
  );

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
  };

  return {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    clearSearch,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
  };
}
