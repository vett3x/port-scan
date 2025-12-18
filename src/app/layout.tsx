import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ethical Port Scanner | Hacking Tool",
  description: "Professional network scanning tool for ethical hacking and security auditing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
          @keyframes scanline {
            0% {
              transform: translateY(-100%);
            }
            100% {
              transform: translateY(100vh);
            }
          }
          @keyframes glitch {
            0% {
              transform: translate(0);
            }
            20% {
              transform: translate(-2px, 2px);
            }
            40% {
              transform: translate(-2px, -2px);
            }
            60% {
              transform: translate(2px, 2px);
            }
            80% {
              transform: translate(2px, -2px);
            }
            100% {
              transform: translate(0);
            }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </head>
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased overflow-x-hidden`}>
        {/* Scanline effect */}
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500 opacity-10 animate-scanline" 
               style={{animation: 'scanline 8s linear infinite'}}></div>
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
      </body>
    </html>
  );
}