const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true", // فعال فقط وقتی ANALYZE=true باشه
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    remotePatterns: [
      // ────── هاست بک‌اند روی شبکهٔ محلی ──────
      { protocol: "http", hostname: "192.168.103.17", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "192.168.103.17", port: "8000", pathname: "/static/**" },

      // ────── localhost (اختیاری) ──────
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/static/**" },

      // ────── هاست عکس‌های نمونه (Picsum) ──────
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"], // فرمت‌های بهینه‌تر برای عکس
  },

  async rewrites() {
    const backend = process.env.NEXT_BACKEND_ORIGIN || "http://192.168.103.17:8000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/media/:path*", destination: `${backend}/media/:path*` },
      { source: "/static/:path*", destination: `${backend}/static/:path*` },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
