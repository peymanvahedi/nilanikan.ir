import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";
import ClientProviders from "@/components/ClientProviders";
import Footer from "@/components/Footer";
import GoftinoWidget from "@/components/GoftinoWidget"; // ✅ افزودن ویجت گفتینو

export const metadata: Metadata = {
  title: "فروشگاه نیلانیکان",
  description: "خرید آنلاین پوشاک کودک و نوجوان - نیلانیکان",
};

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.className} bg-white text-zinc-900`}
        suppressHydrationWarning
      >
        <ClientProviders>
          <Header />
          <main className="min-h-[calc(100vh-80px)]">{children}</main>
          <Footer />
        </ClientProviders>

        {/* ✅ گفتینو همیشه بعد از محتوای صفحه لود می‌شود */}
        <GoftinoWidget />
      </body>
    </html>
  );
}
