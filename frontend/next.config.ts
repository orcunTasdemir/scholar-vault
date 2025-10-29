import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '10.150.200.84',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;