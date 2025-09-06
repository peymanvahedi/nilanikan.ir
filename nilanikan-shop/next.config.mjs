// next.config.mjs
const PUBLIC_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

let host = "";
let protocol = "https";
let port = "";

if (PUBLIC_BASE) {
  try {
    const u = new URL(PUBLIC_BASE);
    host = u.hostname;
    protocol = u.protocol.replace(":", "") || "https";
    port = u.port || "";
  } catch {}
}

const API_BASE_INTERNAL = (process.env.INTERNAL_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
const MEDIA_BASE_INTERNAL = API_BASE_INTERNAL.replace(/\/api$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost",    pathname: "/**" },
      { protocol: "http",  hostname: "127.0.0.1",    pathname: "/**" },
      { protocol: "https", hostname: "**.app.github.dev", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" }, // ← اضافه شد
      ...(host
        ? [{ protocol, hostname: host, port, pathname: "/**" }]
        : []),
    ],
  },

  async rewrites() {
    return [
      { source: "/api/:path*",   destination: `${API_BASE_INTERNAL}/:path*` },
      { source: "/media/:path*", destination: `${MEDIA_BASE_INTERNAL}/media/:path*` },
    ];
  },
};

export default nextConfig;
