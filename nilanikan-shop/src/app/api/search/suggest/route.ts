// src/app/api/search/suggest/route.ts
import { NextResponse } from "next/server";

/**
 * خروجی: { results: [...] }
 * تلاش می‌کند از lib/api استفاده کند؛ در غیر اینصورت به NEXT_PUBLIC_API_BASE سقوط می‌کند.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = String(url.searchParams.get("q") ?? "").trim();
    if (!q) return NextResponse.json({ results: [] });

    // Try using project's lib/api if exists
    try {
      const mod = await import("@/lib/api");
      const { get, endpoints, buildQuery } = mod as any;
      if (get && endpoints?.products) {
        const query = buildQuery ? buildQuery({ page: 1, limit: 8, search: q }) : `?search=${encodeURIComponent(q)}&limit=8&page=1`;
        const data = await get(`${endpoints.products}${query}`, { throwOnHTTP: false, fallback: { results: [] } });
        const items = Array.isArray(data) ? data : data?.results ?? data?.items ?? data?.data ?? [];
        return NextResponse.json({ results: items });
      }
    } catch {
      // ignore and fallback
    }

    // Fallback: public API
    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "";
    if (!apiBase) return NextResponse.json({ results: [] });

    const r = await fetch(`${apiBase}/products?search=${encodeURIComponent(q)}&limit=8&page=1`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return NextResponse.json({ results: [] }, { status: r.status });
    const json = await r.json();
    const items = Array.isArray(json) ? json : json?.results ?? json?.items ?? json?.data ?? [];
    return NextResponse.json({ results: items });
  } catch (err) {
    console.error("search.suggest error:", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
