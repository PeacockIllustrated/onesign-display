import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        // Menu theme fonts are content-stable — a new cut ships under a new
        // filename. Caching them hard means a player fetches each file once and
        // then renders menus with correct typography indefinitely, including
        // through a network outage.
        source: '/fonts/menus/:file*.woff2',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
