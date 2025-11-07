"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Image from "next/image";
import DocumentHeader from "@/components/layout/DocumentHeader";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.53:3000";

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isLoading, logout, setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setProfileImage(user.profile_image_url);
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsUpdating(true);
    setError("");
    setMessage("");

    try {
      const updatedUser = await api.updateProfile(token, username || null);
      setUser(updatedUser);
      setMessage("Username updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update username"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // validate file type
    if (
      !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
      setError("Please upload a JPG, PNG, or Webp image");
      e.target.value = "";
      return;
    }

    // validate size
    if (file.size > 5 * 1024 * 1024) {
      setError(
        `Image is too large. Maximum size is 5MB (your file: ${(
          file.size /
          1024 /
          1024
        ).toFixed(1)}MB)`
      );
      e.target.value = "";
      return;
    }

    setIsUploadingImage(true);
    setError("");
    setMessage("");

    try {
      const updatedUser = await api.uploadProfileImage(token, file);
      setUser(updatedUser);
      setProfileImage(updatedUser.profile_image_url);
      setMessage("Profile image uploaded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async () => {
    if (!token) return;
    if (
      !window.confirm("Are you sure you want to delete your profile image?")
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const updatedUser = await api.deleteProfileImage(token);
      setUser(updatedUser);
      setProfileImage(null);
      setMessage("Profile image deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <DocumentHeader
        title="Profile Settings"
        backPath="/dashboard"
        backText="Back to Dashboard"
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-deep-charcoal/50 backdrop-blur-md rounded-lg p-8 border border-off-white/10">
          {/* Success/Error Messages */}
          {message && (
            <div className="mb-6 bg-muted-teal/10 border border-muted-teal text-off-white px-4 py-3 rounded-lg">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Profile Image Section */}
          <div className="bg-deep-charcoal/80 backdrop-blur-sm border border-off-white/10 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-old-paper-yellow mb-4 border-b border-b-old-paper-yellow/50">
              Profile Image
            </h2>
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                {profileImage ? (
                  <Image
                    src={`${API_BASE_URL}/${profileImage}`}
                    alt="Profile"
                    width={120}
                    height={120}
                    className="rounded-full object-cover border-4 border-muted-teal"
                  />
                ) : (
                  <div className="w-30 h-30 bg-muted-teal rounded-full flex items-center justify-center text-off-white text-4xl font-semibold">
                    {(user.username || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-off-white/70 mb-4">
                  Upload a profile image. JPG, PNG, or WebP. Max size 5MB.
                </p>
                <div className="flex gap-3">
                  <label
                    className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                      isUploadingImage
                        ? "bg-off-white/20 text-off-white/40 cursor-not-allowed"
                        : "bg-muted-teal text-off-white hover:bg-muted-teal/90"
                    }`}
                  >
                    {isUploadingImage ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>
                  {profileImage && (
                    <button
                      onClick={handleDeleteImage}
                      className="px-4 py-2 bg-destructive text-off-white text-sm rounded-md hover:bg-destructive/90 transition-colors"
                    >
                      Delete Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="bg-deep-charcoal/80 backdrop-blur-sm border border-off-white/10 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-old-paper-yellow mb-4 border-b border-b-old-paper-yellow/50">
              Account Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-old-paper-yellow mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-off-white/20 rounded-md bg-deep-charcoal/50 text-off-white/50 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-off-white/50">
                  Email cannot be changed
                </p>
              </div>

              <form onSubmit={handleUpdateUsername}>
                <label className="block text-sm font-medium text-old-paper-yellow mb-1">
                  Username
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username (optional)"
                    className="flex-1 px-3 py-2 border border-off-white/20 bg-deep-charcoal/50 text-off-white placeholder:text-off-white/40 rounded-md focus:outline-none focus:ring-2 focus:ring-muted-teal focus:border-muted-teal"
                  />
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isUpdating
                        ? "bg-off-white/20 text-off-white/40 cursor-not-allowed"
                        : "bg-muted-teal text-off-white hover:bg-muted-teal/90"
                    }`}
                  >
                    {isUpdating ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-deep-charcoal/80 backdrop-blur-sm border-2 border-destructive/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-old-paper-yellow mb-4 border-b border-b-old-paper-yellow/50">
              Danger Zone
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-off-white">Sign Out</p>
                <p className="text-sm text-off-white/70">
                  Sign out of your account
                </p>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="px-4 py-2 bg-destructive text-off-white text-sm rounded-md hover:bg-destructive/90 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
