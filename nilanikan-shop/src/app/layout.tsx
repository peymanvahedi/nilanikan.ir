import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";
import ClientProviders from "@/components/ClientProviders";

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
          {/* هدر سایت */}
          <Header />

          {/* محتوای اصلی */}
          <main className="min-h-[calc(100vh-80px)]">{children}</main>

          {/* فوتر */}
          <footer className="mt-16 border-t border-zinc-200">
            <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-zinc-600 text-center">
              © {new Date().getFullYear()} نیلانیکان — تمامی حقوق محفوظ است.
            </div>
          </footer>
        </ClientProviders>
      </body>
    </html>
  );
}
