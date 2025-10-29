"use client";

import { useState } from "react";
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
import { Search, Upload, FolderPlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AppHeaderProps {
  user: {
    username: string | null; // Changed from string | undefined
    email: string;
    profile_image_url: string | null; // Changed from string | undefined
  };
  onUploadClick: () => void;
  onCreateFolder: () => void;
  onLogout: () => void;
}

export function AppHeader({
  user,
  onUploadClick,
  onCreateFolder,
  onLogout,
}: AppHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 w-full h-16 border-b bg-background shrink-0">
      <div className="flex h-full items-center gap-4 px-6 w-full max-w-full">
        {/* LEFT: Sidebar Toggle + Logo */}
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <Image src="/logo.png" alt="ScholarVault" width={32} height={32} />
            <h1 className="text-xl font-bold font-display hidden sm:block">
              ScholarVault
            </h1>
          </div>
        </div>

        {/* CENTER: Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents, authors, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* RIGHT: Actions + User Menu */}
        <div className="flex items-center gap-2">
          {/* Upload Button */}
          <Button onClick={onUploadClick} size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>

          {/* New Folder Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">New Collection</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCreateFolder}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Collection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-lg hover:bg-accent p-2">
                {user.profile_image_url ? (
                  <Image
                    src={`http://10.0.0.57:3000/${user.profile_image_url}`}
                    alt={user.username || "User"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    {(user.username || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
