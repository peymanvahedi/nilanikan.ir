// src/app/api/v1/menu/route.ts
import { NextResponse } from "next/server";

const targets = [
  process.env.NEXT_PUBLIC_API_BASE
    ? `${process.env.NEXT_PUBLIC_API_BASE}/api/categories/menu/`
    : null,
  "/api/categories/menu/",
].filter(Boolean) as string[];

export async function GET() {
  for (const url of targets) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!r.ok) continue;
      const data = await r.json();
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        },
      });
    } catch {}
  }
  return NextResponse.json([], { status: 200 });
}
