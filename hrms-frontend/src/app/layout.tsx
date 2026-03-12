import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import NotificationManager from "@/components/NotificationManager";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HRMS Portal",
  description: "Progressive Web App HR Management System",
  manifest: "/manifest.webmanifest",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen`}>
        <AuthProvider>
          <NotificationManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
