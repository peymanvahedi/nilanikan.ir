// src/app/api/search/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    if (!q) return NextResponse.json({ results: [] });

    // سعی کن از lib/api پروژه استفاده کنی (اگه وجود داشته باشه)
    try {
      const mod = await import("@/lib/api");
      const { get, endpoints, buildQuery } = mod as any;

      if (get && endpoints) {
        // به‌صورت امن و بدون ?? روی عبارتِ همیشه-استرینگ:
        const epSearch: string | undefined =
          (endpoints as any).search ||
          (typeof (endpoints as any).home === "string"
            ? (endpoints as any).home.replace(/\/home\/?$/, "/") + "search/"
            : undefined);

        if (epSearch) {
          // اگر داخل epSearch قبلاً پارامتر داشت، & بزن؛ وگرنه ?q=
          const hasQuery = epSearch.includes("?");
          const base = epSearch.endsWith("/") || epSearch.endsWith("?") ? epSearch : epSearch;
          const finalUrl = hasQuery
            ? `${base}&q=${encodeURIComponent(q)}`
            : `${base}${base.endsWith("/") ? "" : "/"}?q=${encodeURIComponent(q)}`;

          const resp = await get(finalUrl, { throwOnHTTP: false, fallback: { results: [] } });
          if (Array.isArray(resp)) return NextResponse.json({ results: resp });
          return NextResponse.json(resp ?? { results: [] });
        }

        // fallback: جستجو روی لیست محصولات
        const query = buildQuery
          ? buildQuery({ page: 1, limit: 20, search: q })
          : `?search=${encodeURIComponent(q)}&limit=20&page=1`;

        const data = await get(`${endpoints.products}${query}`, {
          throwOnHTTP: false,
          fallback: { results: [] },
        });

        const items = Array.isArray(data) ? data : data?.results ?? data?.items ?? data?.data ?? [];
        return NextResponse.json({ results: items });
      }
    } catch {
      // اگر lib/api نبود، می‌ریم سراغ fallback عمومی
    }

    // Fallback نهایی: مستقیم به NEXT_PUBLIC_API_BASE
    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "";
    if (!apiBase) return NextResponse.json({ results: [] });

    const r = await fetch(`${apiBase}/products?search=${encodeURIComponent(q)}&limit=20&page=1`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return NextResponse.json({ results: [] }, { status: r.status });

    const json = await r.json();
    const items = Array.isArray(json) ? json : json?.results ?? json?.items ?? json?.data ?? [];
    return NextResponse.json({ results: items });
  } catch (err) {
    console.error("search api error:", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
