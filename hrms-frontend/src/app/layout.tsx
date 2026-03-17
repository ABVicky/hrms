import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import NotificationManager from "@/components/NotificationManager";
import PWAHandler from "@/components/PWAHandler";
import InstallPrompt from "@/components/InstallPrompt";

import { PWAProvider } from "@/contexts/PWAContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ASPIRE Portal",
  description: "Progressive Web App HR Management System",
  manifest: "/manifest",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ASPIRE Portal",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen`}>
        <AuthProvider>
          <PWAProvider>
            <NotificationManager />
            <PWAHandler />
            <PWAUpdatePrompt />
            <InstallPrompt />
            {children}
          </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
