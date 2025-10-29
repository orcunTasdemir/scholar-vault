"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Image from "next/image";

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
    <div className="min-h-screen ">
      <header className="border-b border-gray-100/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex w-full max-w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="ScholarVault Logo"
                width={40}
                height={40}
              />
              <h1 className="text-2xl font-bold text-gray-900">
                Profile Settings
              </h1>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="ml-auto px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {message && (
          <div className="mb-6 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Profile Image Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Profile Image
          </h2>
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {profileImage ? (
                <Image
                  src={`http://10.0.0.57:3000/${profileImage}`}
                  alt="Profile"
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-30 h-30 bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-semibold">
                  {(user.username || user.email).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-4">
                Upload a profile image. JPG, PNG, or WebP. Max size 5MB.
              </p>
              <div className="flex gap-3">
                <label
                  className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                    isUploadingImage
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
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
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                  >
                    Delete Image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Information Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed
              </p>
            </div>

            <form onSubmit={handleUpdateUsername}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (optional)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isUpdating
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isUpdating ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Danger Zone
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Sign Out</p>
              <p className="text-sm text-gray-600">Sign out of your account</p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
