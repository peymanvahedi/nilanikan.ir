"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchProducts, post, endpoints } from "@/lib/api";
import type { ProductItem } from "@/types/home";

type LoadState = "idle" | "loading" | "done" | "error";

function ProductCard({
  p,
  onAdd,
  busy,
}: {
  p: ProductItem;
  onAdd: (p: ProductItem) => void;
  busy: boolean;
}) {
  const hasDiscount =
    typeof p.compareAtPrice === "number" && p.compareAtPrice > (p.price ?? 0);
  const percent = hasDiscount
    ? Math.round(((p.compareAtPrice! - (p.price ?? 0)) / p.compareAtPrice!) * 100)
    : 0;

  return (
    <div className="border rounded-xl p-3">
      <Link href={p.link || "#"} className="block group">
        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-50">
          <img
            src={p.imageUrl}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition"
            loading="lazy"
          />
        </div>
        <div className="mt-2 text-sm line-clamp-2">{p.title}</div>
      </Link>

      <div className="flex items-center gap-2 mt-2 text-sm">
        {typeof p.price === "number" && (
          <span className="font-bold">{p.price.toLocaleString()} تومان</span>
        )}
        {hasDiscount && (
          <>
            <del className="text-xs text-gray-400">
              {p.compareAtPrice!.toLocaleString()}
            </del>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              %{percent}
            </span>
          </>
        )}
      </div>

      <button
        onClick={() => onAdd(p)}
        disabled={busy}
        className="mt-3 w-full bg-black text-white rounded-lg py-2 text-sm disabled:opacity-60"
      >
        {busy ? "در حال افزودن..." : "افزودن به سبد"}
      </button>
    </div>
  );
}

export default function ProductsPage() {
  const sp = useSearchParams();
  const tab = (sp.get("tab") || "").toLowerCase(); // "", "sets"

  const [items, setItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<LoadState>("idle");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading("loading");
      setMsg("");
      try {
        if (tab === "sets") {
          // فقط «ست‌ها»: تگ‌های معادل ست
          const setTags = ["set", "sets", "ست", "ست‌ها"];
          const acc: ProductItem[] = [];
          for (const t of setTags) {
            const r = await fetchProducts({ tag: t, limit: 40 });
            const list = Array.isArray(r?.results)
              ? r.results
              : Array.isArray(r as any)
              ? (r as any)
              : [];
            for (const it of list as any[]) {
              const id = String((it as any).id ?? "");
              if (!acc.find((x) => x.id === id)) acc.push(it as ProductItem);
            }
          }
          if (!cancelled) {
            setItems(acc);
            setLoading("done");
          }
        } else {
          // تب «همه»
          const r = await fetchProducts({ limit: 40 });
          const list = Array.isArray(r?.results)
            ? r.results
            : Array.isArray(r as any)
            ? (r as any)
            : [];
          if (!cancelled) {
            setItems(list as ProductItem[]);
            setLoading("done");
          }
        }
      } catch {
        if (!cancelled) {
          setLoading("error");
          setMsg("خطا در بارگذاری محصولات");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab]);

  // مرتب‌سازی ساده: ارزان‌ترها جلوتر
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const pa =
        typeof a.price === "number" ? a.price : Number.MAX_SAFE_INTEGER;
      const pb =
        typeof b.price === "number" ? b.price : Number.MAX_SAFE_INTEGER;
      return pa - pb;
    });
  }, [items]);

  // افزودن به سبد (payloadهای رایج)
  const addToCart = async (p: ProductItem) => {
    try {
      setBusyId(p.id);
      setMsg("");
      const candidates = [
        { product: p.id, quantity: 1 },
        { product_id: p.id, quantity: 1 },
        { item: p.id, quantity: 1 },
        { id: p.id, quantity: 1 },
      ];
      let ok = false;
      let lastError = "";
      for (const body of candidates) {
        try {
          const resp = await post(endpoints.cart, body, { throwOnHTTP: true });
          if (resp) {
            ok = true;
            break;
          }
        } catch (err: any) {
          lastError = err?.message || "خطا";
        }
      }
      setMsg(ok ? "به سبد خرید اضافه شد ✅" : `عدم موفقیت در افزودن ❌ ${lastError}`);
    } finally {
      setBusyId(null);
      setTimeout(() => setMsg(""), 2500);
    }
  };

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {tab === "sets" ? "ست‌ها" : "محصولات"}
        </h1>
        <Link href="/" className="underline">
          بازگشت به خانه
        </Link>
      </div>

      {/* تب‌ها */}
      <div className="flex gap-3 text-sm">
        <Link
          href="/products"
          className={`px-3 py-1 rounded-full border ${
            tab !== "sets" ? "bg-black text-white" : ""
          }`}
        >
          همه
        </Link>
        <Link
          href="/products?tab=sets"
          className={`px-3 py-1 rounded-full border ${
            tab === "sets" ? "bg-black text-white" : ""
          }`}
        >
          ست‌ها
        </Link>
      </div>

      {loading === "loading" && (
        <div className="text-sm text-gray-500">در حال بارگذاری…</div>
      )}
      {loading === "error" && (
        <div className="text-sm text-red-600">
          {msg || "خطایی رخ داد"}
        </div>
      )}
      {loading === "done" && sorted.length === 0 && (
        <div className="text-sm text-gray-500">محصولی یافت نشد.</div>
      )}
      {msg && loading !== "loading" && <div className="text-sm">{msg}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {sorted.map((p) => (
          <ProductCard
            key={p.id}
            p={p}
            onAdd={addToCart}
            busy={busyId === p.id}
          />
        ))}
      </div>
    </main>
  );
}
