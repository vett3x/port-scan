"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Ethical Port Scanner | Hacking Tool</title>
        <meta name="description" content="Professional network scanning tool for ethical hacking and security auditing" />
      </head>
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased overflow-x-hidden`}>
        <ErrorBoundary>
          {/* Scanline effect */}
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 opacity-10 animate-scanline"></div>
          </div>
          
          {/* Glitch effect overlay */}
          <div className="fixed inset-0 pointer-events-none z-40 opacity-0 hover:opacity-5 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-purple-500/10"></div>
          </div>
          
          {/* Main content */}
          <main className="relative z-10">
            {children}
          </main>
          
          {/* Terminal style border */}
          <div className="fixed inset-0 border-2 border-green-900/30 pointer-events-none z-30"></div>
          
          {/* Toaster for notifications */}
          <Toaster 
            position="top-right"
            expand={false}
            richColors
            closeButton
            theme="dark"
          />
        </ErrorBoundary>
      </body>
    </html>
  );
}