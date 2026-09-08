import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import USABanner from "@components/USABanner";
import Header from "@components/Header";
import Footer from "@components/Footer";
import GoogleTranslate from "@components/GoogleTranslate";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "North Dakota HHS - Child Care Portal",
  description: "Official child care licensing, assistance, and resources portal for the State of North Dakota.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body>
        <LanguageProvider>
          <GoogleTranslate />
          <USABanner />
          <Header />
          <main className="app-main">
            {children}
          </main>
          {/* <Footer /> */}
        </LanguageProvider>
      </body>
    </html>
  );
}
