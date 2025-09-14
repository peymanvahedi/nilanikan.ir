// src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { get, endpoints } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";

    if (!q || q.trim().length < 1) {
      return NextResponse.json({ results: [] });
    }

    // اگر lib/api شما endpoint مخصوص search دارد، از آن استفاده کن:
    // مثال: endpoints.search یا endpoints.home + 'search/'
    const searchEndpoint =
      (endpoints as any).search ||
      (endpoints as any).home?.replace(/\/home\/?$/, "/") + `search/?q=${encodeURIComponent(q)}` ||
      `/search?q=${encodeURIComponent(q)}`;

    // از تابع get پروژه استفاده کن تا header/auth و ... مرجع‌شده رعایت شوند
    const resp = await get<any>(typeof searchEndpoint === "string" ? searchEndpoint : `${searchEndpoint}?q=${encodeURIComponent(q)}`, {
      throwOnHTTP: false,
      fallback: { results: [] },
    });

    // اگر بک‌اند مستقیم آرایه می‌فرسته، بصورت سازگار برگردون
    if (Array.isArray(resp)) return NextResponse.json({ results: resp });

    return NextResponse.json(resp);
  } catch (err) {
    console.error("search api error:", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
