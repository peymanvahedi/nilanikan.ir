// src/lib/pageContext.ts
export type PageContext = {
  url: string;
  path: string;
  title: string;
  product?: {
    slug?: string;
    title?: string;
    category?: string;
    size?: string;
  };
};

export function getClientContext(): PageContext {
  const el = typeof window !== "undefined" ? document.getElementById("nn-product") : null;
  const ds = (el?.dataset || {}) as Record<string, string | undefined>;
  return {
    url: typeof window !== "undefined" ? window.location.href : "",
    path: typeof window !== "undefined" ? window.location.pathname : "",
    title: typeof document !== "undefined" ? document.title : "",
    product: {
      slug: ds.slug,
      title: ds.title,
      category: ds.category,
      size: ds.size,
    },
  };
}
