// src/lib/auth.ts  — Django + SimpleJWT (access/refresh)

/* ---------- Base URL ---------- */
const API_BASE =
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_API_URL) ||
  (typeof window !== "undefined" && (window as any).__NEXT_PUBLIC_API_URL__) ||
  "http://localhost:8000";

/* ---------- Token helpers ---------- */
const ACCESS_KEY = "token";
const REFRESH_KEY = "refresh";

export const setToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem(ACCESS_KEY, t);
  else localStorage.removeItem(ACCESS_KEY);
};
export const setRefresh = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem(REFRESH_KEY, t);
  else localStorage.removeItem(REFRESH_KEY);
};

export const getToken = () =>
  (typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null);
export const getRefresh = () =>
  (typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null);
export const hasToken = () => !!getToken();

/* ---------- Login / Logout (Django endpoints) ---------- */
/**
 * لاگین با username/password
 * POST /api/auth/login/  →  { access, refresh }
 */
export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Login failed");
  }
  const data: { access?: string; refresh?: string; [k: string]: any } =
    (await res.json().catch(async () => ({ raw: await res.text() }))) || {};
  if (data.access) setToken(data.access);
  if (data.refresh) setRefresh(data.refresh);
  return data;
}

export async function logout(): Promise<void> {
  setToken(null);
  setRefresh(null);
}

/* ---------- Refresh helper ---------- */
async function tryRefresh(): Promise<string | null> {
  const ref = getRefresh();
  if (!ref) return null;
  // در api.ts شما refresh = /api/token/refresh/
  const res = await fetch(`${API_BASE}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({ refresh: ref }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({} as any));
  const newAccess: string | undefined = data.access;
  if (newAccess) {
    setToken(newAccess);
    return newAccess;
  }
  return null;
}

/* ---------- Guarded fetch with auto refresh ---------- */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const url = typeof input === "string" ? input : input.toString();

  const doFetch = async () => {
    const t = getToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.headers as Record<string, string>),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
    return fetch(url, { ...init, headers, credentials: "include" });
  };

  // try once
  let res = await doFetch();
  if (res.status !== 401) return res;

  // if unauthorized, try refresh then retry once
  const newAccess = await tryRefresh();
  if (!newAccess) return res;

  res = await doFetch();
  return res;
}

/* ---------- Current user ---------- */
export async function currentUser(): Promise<any | null> {
  try {
    const t = getToken();
    const res = await fetch(`${API_BASE}/api/auth/me/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json().catch(() => null);
  } catch {
    return null;
  }
}

/* ---------- Misc ---------- */
export async function isAuthenticated(): Promise<boolean> {
  return !!getToken();
}

export async function loginWithToken(token: string, refresh?: string) {
  setToken(token);
  if (refresh) setRefresh(refresh);
  return true;
}
