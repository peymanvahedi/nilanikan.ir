/** @type {import('next').NextConfig} */
const nextConfig = {
  
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
reactStrictMode: true,
  async rewrites() {
    return [
      //   /api/...       
      { source: '/api/:path*', destination: 'http://web:8000/api/:path*/' },
    ];
  },
};
module.exports = nextConfig;
