export type SortOption = "latest" | "price-asc" | "price-desc" | "popular";

export type QueryState = {
  q: string;
  category: string[];
  types: string[];
  colors: string[];
  sizes: string[];
  minPrice?: number;
  maxPrice?: number;
  sort: SortOption;
  page: number;
  perPage: number;
};

export const defaultQueryState: QueryState = {
  q: "",
  category: [],
  types: [],
  colors: [],
  sizes: [],
  sort: "latest",
  page: 1,
  perPage: 24,
};

/**
 * ورودی: state
 * خروجی: URLSearchParams برای قرار دادن در کوئری‌استرینگ
 */
export function buildQueryFromParams(state: Partial<QueryState>): URLSearchParams {
  const s: QueryState = { ...defaultQueryState, ...state };

  const params = new URLSearchParams();

  if (s.q) params.set("q", s.q);

  for (const c of s.category) params.append("category", c);
  for (const t of s.types) params.append("type", t);
  for (const c of s.colors) params.append("color", c);
  for (const sz of s.sizes) params.append("size", sz);

  if (typeof s.minPrice === "number") params.set("minPrice", String(s.minPrice));
  if (typeof s.maxPrice === "number") params.set("maxPrice", String(s.maxPrice));

  if (s.sort) params.set("sort", s.sort);
  params.set("page", String(s.page));
  params.set("perPage", String(s.perPage));

  return params;
}


