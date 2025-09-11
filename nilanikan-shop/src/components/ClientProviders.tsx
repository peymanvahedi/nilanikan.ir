// src/components/ClientProviders.tsx
"use client";

import CartProvider from "@/components/CartProvider";
import TourProvider from "@/components/tour/TourProvider";
import PageTour from "@/components/tour/PageTour";
import HelpFab from "@/components/tour/HelpFab";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <TourProvider>
        <PageTour />
        {children}
        <HelpFab />
      </TourProvider>
    </CartProvider>
  );
}
