"use client";

import Link from "next/link";

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({
  items,
  className = "",
  separator = "›",
}: {
  items: Crumb[];
  className?: string;
  separator?: string;
}) {
  const trail = (items || []).filter(Boolean);

  return (
    <nav aria-label="مسیر صفحه" dir="rtl" className={`w-full text-sm ${className}`}>
      <ol className="flex flex-wrap items-center gap-2 text-zinc-500">
        {trail.map((it, i) => {
          const isLast = i === trail.length - 1;
          return (
            <li key={`${it.label}-${i}`} className="flex items-center gap-2 min-w-0">
              {isLast ? (
                <span className="text-zinc-900 font-semibold truncate max-w-[70vw]">{it.label}</span>
              ) : it.href ? (
                <Link href={it.href} className="hover:text-pink-600 font-medium">
                  {it.label}
                </Link>
              ) : (
                <span>{it.label}</span>
              )}
              {!isLast && <span className="select-none">{separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
