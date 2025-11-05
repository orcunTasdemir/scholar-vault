import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '10.0.0.53',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;