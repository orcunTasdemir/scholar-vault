"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface DocumentHeaderProps {
  title: string;
  backPath: string;
  backText?: string;
}

export default function DocumentHeader({
  title,
  backPath,
  backText = "Back",
}: DocumentHeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-deep-charcoal border-b border-off-white/10 sticky top-0 z-50 h-16">
      <div className="flex h-full items-center px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(backPath)}
            className="text-old-paper-yellow hover:text-old-paper-yellow/80 flex items-center gap-1 transition-colors text-sm font-semibold"
          >
            ← {backText}
          </button>
          <div className="h-4 w-px bg-off-white/20"></div>
          <Image
            src="/logo.png"
            alt="ScholarVault Logo"
            width={28}
            height={28}
          />
          <h1 className="text-lg font-bold text-off-white font-logo truncate">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}
