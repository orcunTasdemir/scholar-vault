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
  onSearch: (query: string) => void;
  onLogout: () => void;
}

export function AppHeader({
  user,
  onUploadClick,
  onCreateFolder,
  onSearch,
  onLogout,
}: AppHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100/20 h-16 shrink-0">
      <div className="flex h-full items-center gap-4 px-6 w-full max-w-full">
        {/* LEFT: Sidebar Toggle + Logo */}
        <div className="flex basis-1/3 items-center gap-3">
          <SidebarTrigger />
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <Image src="/logo.png" alt="ScholarVault" width={32} height={32} />
            <h1 className="font-logo text-2xl hidden sm:block ">
              ScholarVault
            </h1>
          </div>
        </div>

        {/* CENTER: Search Bar */}
        <div className="flex-1 basis-1/3 max-w-2xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground " />
          <Input
            type="search"
            placeholder="Search documents, authors, keywords..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
            className="pl-10 bg-gray-100/40"
          />
        </div>

        {/* RIGHT: Actions + User Menu */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Upload Button */}
          <Button
            onClick={onUploadClick}
            size="sm"
            className="gap-2 px-8 py-4 bg-[#8B4513] hover:bg-[#8B4513] text-white font-bold rounded-lg shadow-[0_6px_0_#5A2E0A] hover:translate-y-[2px] hover:shadow-[0_4px_0_#5A2E0A] active:translate-y-[6px] active:shadow-none transition-all duration-150"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>

          {/* New Collection Button */}
          <Button
            // variant="outline"
            size="sm"
            className="gap-2 px-8 py-4 bg-[#8B4513] hover:bg-[#8B4513] text-white hover:text-white font-bold rounded-lg shadow-[0_6px_0_#5A2E0A] hover:translate-y-[2px] hover:shadow-[0_4px_0_#5A2E0A] active:translate-y-[6px] active:shadow-none transition-all duration-150"
            onClick={onCreateFolder}
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New Collection</span>
          </Button>
          {/* <DropdownMenu>
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
          </DropdownMenu> */}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative rounded-full p-[4px] bg-gray-100 shadow-[0_6px_0_#b7967e] hover:translate-y-[2px] hover:shadow-[0_4px_0_#b7967e] active:translate-y-[6px] active:shadow-none transition-all duration-150">
                {user.profile_image_url ? (
                  <Image
                    src={`http://10.0.0.57:3000/${user.profile_image_url}`}
                    alt={user.username || "User"}
                    width={32}
                    height={32}
                    className="rounded-full border-0 border-white shadow-inner select-none pointer-events-none"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold border-2 border-white shadow-inner select-none pointer-events-none">
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
