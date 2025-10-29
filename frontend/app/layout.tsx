import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Inter,
  Goudy_Bookletter_1911,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export const logoFont = Goudy_Bookletter_1911({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: "400",
});

export const displayFont = Inter({
  variable: "--font-display",
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScholarVault",
  description: "AI-powered bibliography management for researchers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} ${logoFont.variable} antialiased`}
      >
        <div className="fixed inset-0 bg-[url(../public/background.png)] bg-cover opacity-80 -z-1"></div>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
