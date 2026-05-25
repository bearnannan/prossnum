import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import OfflineSyncManager from "@/components/OfflineSyncManager";
import ActivityTracker from "@/components/ActivityTracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0d0b12",
};

export const metadata: Metadata = {
  title: "ProssNum — Infrastructure Dashboard",
  description: "Real-time tracking for station installation progress. Enterprise-grade infrastructure management platform.",
  manifest: "/manifest.json",
};

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <ActivityTracker />
            </Suspense>
            <OfflineSyncManager />
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
