import "./globals.css";
import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import Navbar from "@/components/common/NavBar";
import Footer from "@/components/common/Footer";
import { AuthProvider } from "@/context/AuthContext";
import InteractiveBackground from "@/components/ui/InteractiveBackground";

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
  variable: "--font-titillium",
});

export const metadata: Metadata = {
  title: {
    default: "PreseedMe | Discover solopreneurs",
    template: "%s | PreseedME",
  },
  description: "Connect with indie founders and micro-investors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={titillium.variable}>
      {/* 1. min-h-screen & flex-col: Forces footer to bottom if content is short
         2. relative: Establish context for children
      */}
      <body className="min-h-screen flex flex-col antialiased relative selection:bg-[var(--brand)]/30 selection:text-[var(--brand-light)]">
        <AuthProvider>
          {/* LAYER 0: Background (Fixed, z-index: -10) */}
          <InteractiveBackground />
          
          {/* LAYER 1: Header (Fixed inside component, z-index: 50) */}
          <Navbar />

          {/* LAYER 2: Main Content 
              flex-1: Pushes footer down
              pt-24: IMPORTANT! Adds space so content isn't hidden behind Fixed Navbar
          */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
            {children}
          </main>
          
          {/* LAYER 3: Footer */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}