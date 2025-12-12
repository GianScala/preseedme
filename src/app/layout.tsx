import "./globals.css";
import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import Navbar from "@/components/common/NavBar";
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
    default: "PreseedMe | Connect with founders and micro-investors",
    template: "%s | PreseedME",
  },
  description: "Connect with founders and micro-investors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={titillium.variable}>
      <body className="min-h-screen flex flex-col antialiased relative selection:bg-[var(--brand)]/30 selection:text-[var(--brand-light)]">
        <AuthProvider>
          <ScrollToTop />
          <InteractiveBackground />
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
            {children}
          </main>
          <Footer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}