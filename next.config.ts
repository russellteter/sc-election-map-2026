import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/blue-intelligence' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/blue-intelligence/' : '',
  images: {
    unoptimized: true,
  },

  // Turbopack configuration (Next.js 16+ default)
  turbopack: {},

  // Performance budgets and optimization (webpack fallback)
  webpack(config, { isServer }) {
    // Only apply performance budgets on client build
    if (!isServer) {
      config.performance = {
        hints: 'warning',
        maxEntrypointSize: 200000, // 200KB - warn if entry exceeds this
        maxAssetSize: 100000, // 100KB - warn if individual asset exceeds this
      };
    }

    return config;
  },
};

export default nextConfig;
