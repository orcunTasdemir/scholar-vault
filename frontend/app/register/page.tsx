"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { AnimatedPaperBackground } from "@/components/auth/AnimatedPaperBackground";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register(email, password, username);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-charcoal py-12 px-4 sm:px-6 text-off-white lg:px-8 relative overflow-hidden">
      <AnimatedPaperBackground />

      <div className="max-w-lg w-full bg-deep-charcoal/90 rounded-2xl p-10 space-y-8 border border-off-white/10 relative z-10">
        <div className="text-center">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/logo.png"
              alt="ScholarVault Logo"
              width={120}
              height={120}
              priority
            />
            <h2 className="text-3xl font-bold ">
              <span className=" text-lg font-light">
                Create your account for&nbsp;&nbsp;
              </span>{" "}
              <br />
              <span className="font-logo">
                ScholarVault<span className="text-[10px]">V0.1</span>
              </span>
            </h2>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 bg-off-white/5 p-10 rounded-2xl border border-off-white/10"
        >
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="flex flex-col">
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-1"
              >
                Username (Optional)
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-off-white/20 bg-deep-charcoal/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-muted-teal focus:border-muted-teal disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-[11px] flex justify-end">
                * will be assigned generated username if left empty
              </span>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-off-white/20 bg-deep-charcoal/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-muted-teal focus:border-muted-teal disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-off-white/20 bg-deep-charcoal/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-muted-teal focus:border-muted-teal disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-deep-charcoal bg-muted-teal hover:bg-muted-teal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-muted-teal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
          <p className="mt-2 text-sm text-center">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-muted-teal hover:text-muted-teal/80"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
      <span className="bg-deep-charcoal/90 fixed bottom-4 right-5 z-100 border border-off-white/10 p-2 max-w-lg rounded-2xl text-center text-sm">
        <span className="text-xs">by</span> Orcun Tasdemir
      </span>
    </div>
  );
}
