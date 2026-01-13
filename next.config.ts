import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/sc-election-map-2026' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/sc-election-map-2026/' : '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
