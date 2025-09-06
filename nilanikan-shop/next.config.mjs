// next.config.mjs
const RAW = process.env.INTERNAL_API_URL || ""; // مثلا http://web:8000/api
const HAS_API = RAW.endsWith("/api") || RAW.includes("/api/");
const BASE = RAW.replace(/\/$/, "");
const ORIGIN = HAS_API ? BASE.replace(/\/api$/, "") : BASE;

const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true, remotePatterns: [{ protocol: "http", hostname: "**" }, { protocol: "https", hostname: "**" }] },
  async rewrites() {
    const base = ORIGIN || (process.env.CODESPACES ? "http://localhost:8000" : "http://web:8000");
    return [
      { source: "/api/:path*",   destination: `${base}/api/:path*` },
      { source: "/media/:path*", destination: `${base}/media/:path*` },
    ];
  },
};
export default nextConfig;
