"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const paperImages = [
    "1cab2f46-8e0f-4ef6-bc5e-9ac297f485da.png-02.png",
    "1d93934c-9bcd-4c7b-8955-5ae93567dfe4.png-02.png",
    "5a93d29f-dd31-44a4-a455-bc93c28d4393.png-02.png",
    "9be8c6cd-fd80-4f2b-a86a-54edbd59e5eb.png-03.png",
    "9f4fd85d-76cd-47dd-b099-487c6c50e066.png-02.png",
    "15e65654-21e4-4b5f-88ff-11354c92eed8.png-03.png",
    "17f0e55e-4097-4ef2-8bca-dc7b1eaec8f6.png-01.png",
    "37e399ef-5d34-4766-b32e-71fcd1103fe2.png-02.png",
    "94fd6459-e3c1-40c1-9176-0888f2cf8036.png-02.png",
    "534bd674-ca83-4d78-904e-32daa169e99b.png-02.png",
    "979b45f9-e071-40d2-ba46-48d8d541eb83.png-02.png",
    "6175c0f9-965a-4725-bf96-55245465b94a.png-02.png",
    "7493c04f-0208-403d-bb00-a94acaf1fb9c.png-02.png",
    "15867ea7-6320-460a-ae4a-d39598147477.png-02.png",
    "ae792434-2ae2-410f-bc74-056b964fa427.png-02.png",
    "b3ca1115-61cc-461b-97e1-a4a918d434be.png-03.png",
    "c4864f35-7c8b-40d3-9bb3-5263a0bbcf3d.png-02.png",
    "c7879767-31b4-4f18-8d92-14d7729d0e4b.png-01.png",
    "d58bfd9c-a86c-4edc-b429-b5716dea7089.png-02.png",
    "d86b958c-55cb-4e99-81d3-eebbaf7d3747.png-01.png",
    "e7ff34a1-71e2-42dd-a727-b01f56e3fc2e.png-2.png",
    "f945f1a5-2055-419e-896d-03af20d125e6.png-02.png",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-charcoal py-12 px-4 sm:px-6 text-off-white lg:px-8 relative overflow-hidden">
      {/* Left flowing papers - 2 columns */}
      <div className="hidden lg:flex absolute left-0 top-0 bottom-0 w-3xl gap-2 overflow-hidden pl-12">
        {/* Left column 1 - align right */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <div className="animate-flow-down flex flex-col items-end">
            <div className="space-y-2 pb-2 flex flex-col items-end">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 13) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pb-2 flex flex-col items-end">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 13) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Left column 2 - align left */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <div className="animate-flow-down-delayed flex flex-col items-start">
            <div className="space-y-2 pb-2 flex flex-col items-start">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 17) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pb-2 flex flex-col items-start">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 17) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right flowing papers - 2 columns */}
      <div className="hidden lg:flex absolute right-0 top-0 bottom-0 w-3xl gap-2 overflow-hidden pr-12">
        {/* Right column 1 - align right */}
        <div className="flex-1 overflow-hidden relative flex flex-col items-end">
          <div className="animate-flow-down-delayed-more flex flex-col items-end">
            <div className="space-y-2 pb-2 flex flex-col items-end">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 19) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pb-2">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 19) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Right column 2 - align left */}
        <div className="flex-1 overflow-hidden relative flex flex-col items-start">
          <div className="animate-flow-down-delayed-most flex flex-col items-start">
            <div className="space-y-2 pb-2 flex flex-col items-start">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 23) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pb-2">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 23) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

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
                Sign in to&nbsp;&nbsp;
              </span>
              <span className="font-logo">ScholarVault</span>
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
            {isLoading ? "Signing in ..." : "Sign in"}
          </button>
          <p className="mt-2 text-sm text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-muted-teal hover:text-muted-teal/80"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
      <span className="bg-deep-charcoal/90 fixed bottom-4  right-5 z-100 border border-off-white/10 p-2 max-w-lg rounded-2xl text-center text-sm">
        <span className="text-xs">by</span> Orcun Tasdemir
      </span>
    </div>
  );
}
