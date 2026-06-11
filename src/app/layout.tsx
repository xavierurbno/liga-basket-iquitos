import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { getPlatformName } from "@/lib/platform/platform-config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: getPlatformName(),
  description: "Gestión y portal público de ligas deportivas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col overflow-x-clip font-sans">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
