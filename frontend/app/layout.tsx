import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Almendra_Display } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const almendraDisplay = Almendra_Display({
  variable: "--font-almendra-display",
  weight: "400", // This font only has one weight, but you can specify it anyway
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
        className={`${geistSans.variable} ${geistMono.variable} ${almendraDisplay.variable} antialiased`}
      >
        <div className="fixed inset-0 bg-[url(../public/background.png)] bg-cover opacity-80 -z-1"></div>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
