/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    remotePatterns: [
      // backend LAN
      { protocol: "http", hostname: "192.168.103.17", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "192.168.103.17", port: "8000", pathname: "/static/**" },
      // localhost (اختیاری)
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/static/**" },
    ],
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

module.exports = nextConfig;
