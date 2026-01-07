// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import { Suspense } from "react";
import Navbar from "@/components/common/NavBar";
import NavbarSkeleton from "@/components/common/NavbarSkeleton";
import Footer from "@/components/common/Footer";
import { AuthProvider } from "@/context/AuthContext";
import InteractiveBackground from "@/components/ui/InteractiveBackground";
import { Analytics } from "@vercel/analytics/next";
import ScrollToTop from "@/components/common/ScrollToTop";

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
  variable: "--font-titillium",
});

export const metadata: Metadata = {
  title: {
    default: "PreseedMe | Find your next micro-investors",
    template: "%s | PreseedME",
  },
  description: "Find your next micro-investors",
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={titillium.variable}
      style={{
        backgroundColor: "#000", // ✅ instant black (prevents white flash)
        colorScheme: "dark",
      }}
    >
      <head>
        {/* ✅ extra safety: forces first paint to black even before globals.css loads */}
        <style>{`
          html { background: #000 !important; }
          body { background: transparent !important; }
        `}</style>
      </head>

      <body className="min-h-screen flex flex-col antialiased relative selection:bg-[var(--brand)]/30 selection:text-[var(--brand-light)]">
        <AuthProvider>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>

          <InteractiveBackground />

          <Suspense fallback={<NavbarSkeleton />}>
            <Navbar />
          </Suspense>

          <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-4">
            {children}
          </main>

          <Footer />
        </AuthProvider>

        <Analytics />
      </body>
    </html>
  );
}
