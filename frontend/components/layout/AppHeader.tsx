"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Upload, FolderPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface AppHeaderProps {
  user: {
    username: string | null; // Changed from string | undefined
    email: string;
    profile_image_url: string | null; // Changed from string | undefined
  };
  onUploadClick: () => void;
  onCreateFolder: () => void;
  onSearch: (query: string, collectionId?: string | null) => void;
  onLogout: () => void;
  selectedCollectionId?: string | null;
  selectedCollectionName?: string | null;
}

export default function AppHeader({
  user,
  onUploadClick,
  onCreateFolder,
  onSearch,
  onLogout,
  selectedCollectionId,
  selectedCollectionName,
}: AppHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInAllDocs, setSearchInAllDocs] = useState(false);
  const [profileImageSignedUrl, setProfileImageSignedUrl] = useState<string | null>(null);

  // Add debounced search value
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Determine the actual search scope (reset to collection when collection changes)
  const effectiveSearchInAllDocs = selectedCollectionId
    ? searchInAllDocs
    : false;

  // Fetch profile image signed URL when user has a profile image
  useEffect(() => {
    const fetchProfileImageSignedUrl = async () => {
      if (!user.profile_image_url) {
        setProfileImageSignedUrl(null);
        return;
      }

      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setProfileImageSignedUrl(null);
          return;
        }

        const signedUrl = await api.getProfileImageSignedUrl(token);
        setProfileImageSignedUrl(signedUrl);
      } catch (error) {
        console.error("Failed to get profile image signed URL:", error);
        setProfileImageSignedUrl(null);
      }
    };

    fetchProfileImageSignedUrl();
  }, [user.profile_image_url]);

  // Effect to trigger search when debounced value changes
  useEffect(() => {
    const collectionId = effectiveSearchInAllDocs ? null : selectedCollectionId;
    console.log("[AppHeader] Calling onSearch with:", {
      query: debouncedSearchQuery,
      collectionId,
      effectiveSearchInAllDocs,
      selectedCollectionId,
      searchInAllDocs,
    });
    onSearch(debouncedSearchQuery, collectionId);
  }, [
    debouncedSearchQuery,
    onSearch,
    selectedCollectionId,
    effectiveSearchInAllDocs,
    searchInAllDocs,
  ]);

  return (
    <header className="text-off-white/80 sticky top-0 z-50 w-full border-none h-16 shrink-0 bg-deep-charcoal">
      <div className="flex h-full items-center gap-4 px-6 w-full max-w-full">
        {/* LEFT: Sidebar Toggle + Logo */}
        <div className="flex basis-1/3 items-center gap-3">
          <SidebarTrigger className="scale-120" />
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <Image src="/logo.png" alt="ScholarVault" width={32} height={32} />
            <h1 className="font-logo text-2xl hidden sm:block ">
              ScholarVault <span className="text-[10px]">V0.1</span>
            </h1>
          </div>
        </div>

        {/* CENTER: Search Bar */}
        <div className="flex-1 basis-1/3 max-w-2xl">
          <div className="relative text-off-white">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-off-white/60 pointer-events-none" />
            <Input
              type="text"
              placeholder={
                selectedCollectionId && !effectiveSearchInAllDocs
                  ? `Search in ${selectedCollectionName || "collection"}...`
                  : "Search all documents..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 bg-deep-charcoal/50 border-off-white/20 text-off-white placeholder:text-off-white/40 focus:ring-muted-teal/50 focus:border-muted-teal/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-off-white/60 hover:text-off-white transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Search Scope Toggle - only show when in a collection */}
          {selectedCollectionId && searchQuery && (
            <div className="mt-1 flex items-center gap-2">
              <button
                onClick={() => setSearchInAllDocs(!searchInAllDocs)}
                className="text-xs text-off-white/60 hover:text-off-white transition-colors flex items-center gap-1"
              >
                {effectiveSearchInAllDocs ? (
                  <>
                    <span className="text-muted-teal">✓</span> Searching all
                    documents
                  </>
                ) : (
                  <>
                    <span className="text-old-paper-yellow">◉</span> Searching
                    in &quot;{selectedCollectionName}&quot;
                  </>
                )}
              </button>
              <span className="text-xs text-off-white/40">·</span>
              <button
                onClick={() => setSearchInAllDocs(!searchInAllDocs)}
                className="text-xs text-muted-teal hover:text-muted-teal/80 transition-colors"
              >
                {effectiveSearchInAllDocs
                  ? `Search in "${selectedCollectionName}"`
                  : "Search all"}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Actions + User Menu */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Upload Button */}
          <Button
            onClick={onUploadClick}
            size="sm"
            className="gap-2 px-8 py-4 bg-muted-teal hover:bg-off-white text-off-white font-bold rounded-lg hover:text-muted-teal"
            aria-label="Upload document"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
          {/* New Collection Button */}
          <Button
            size="sm"
            className="gap-2 px-8 py-4 bg-muted-teal hover:bg-off-white text-off-white font-bold rounded-lg hover:text-muted-teal"
            onClick={onCreateFolder}
            aria-label="Create new collection"
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New Collection</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative rounded-full p-0.5 hover:bg-gray-100 border-none bg-muted-teal"
                aria-label="Open user menu"
              >
                {profileImageSignedUrl ? (
                  <Image
                    src={profileImageSignedUrl}
                    alt={user.username || "User"}
                    width={32}
                    height={32}
                    className="rounded-full select-none pointer-events-none"
                  />
                ) : (
                  <div className="w-8 h-8 bg-muted-teal rounded-full flex items-center justify-center text-off-white font-semibold select-none pointer-events-none">
                    {(user.username || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-3 w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {user.username || user.email.split("@")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
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
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/subscription")}
              >
                Subscription & Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-red-600 focus:text-red-600"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
