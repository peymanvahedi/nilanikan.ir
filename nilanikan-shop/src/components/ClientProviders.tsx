// src/components/ClientProviders.tsx
"use client";

import CartProvider from "@/components/CartProvider";
// import ChatWidget from "@/components/chat/ChatWidget"; // ❌ حذف شد

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      {/* <ChatWidget /> */} {/* ❌ این خط حذف شد */}
    </CartProvider>
  );
}
