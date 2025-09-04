/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lodash", "date-fns", "lucide-react"],
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      // { protocol: "https", hostname: "media.yourdomain.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    return [
      { source: "/bundle/:slug", destination: "/bundles/:slug" },
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
