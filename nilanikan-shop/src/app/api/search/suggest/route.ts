// src/app/api/search/suggest/route.ts
import { NextResponse } from "next/server";

/**
 * این route سعی می‌کند از lib/api (`get` و `endpoints.products`) استفاده کند.
 * اگر lib/api موجود نباشد، به صورت fallback از NEXT_PUBLIC_API_BASE/products?search=... استفاده می‌کند.
 *
 * خروجی: { results: [...] } یا آرایهٔ ساده. آیتم‌ها باید حداقل یکی از فیلدهای: title/name, slug/href, image, price داشته باشند.
 */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = String(url.searchParams.get("q") ?? "").trim();
    if (!q || q.length < 1) return NextResponse.json({ results: [] });

    // Try using project's lib/api if exists
    try {
      // dynamic import to avoid build errors if lib/api doesn't exist
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = await import("@/lib/api");
      const { get, endpoints, buildQuery } = mod;
      if (get && endpoints && endpoints.products) {
        // build query in same format as search page expects
        const query = buildQuery ? buildQuery({ page: 1, limit: 8, search: q }) : `?search=${encodeURIComponent(q)}&limit=8&page=1`;
        const data = await get(`${endpoints.products}${query}`, { throwOnHTTP: false, fallback: { results: [] } });
        const items = Array.isArray(data) ? data : data.results ?? data.items ?? [];
        return NextResponse.json({ results: items });
      }
    } catch (e) {
      // ignore and fallback to direct fetch below
    }

    // Fallback: try public API base
    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "";
    if (!apiBase) return NextResponse.json({ results: [] });

    const target = `${apiBase}/products?search=${encodeURIComponent(q)}&limit=8&page=1`;
    const r = await fetch(target, { cache: "no-store" });
    if (!r.ok) return NextResponse.json({ results: [] }, { status: r.status });
    const json = await r.json();
    const items = Array.isArray(json) ? json : json.results ?? json.items ?? [];
    return NextResponse.json({ results: items });
  } catch (err) {
    console.error("search.suggest error:", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
