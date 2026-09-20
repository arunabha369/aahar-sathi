import type { NextConfig } from 'next';

/**
 * The browser only ever talks to the Next.js origin: /api is rewritten to the
 * Express API, so the auth cookie stays first-party even when the two apps are
 * deployed separately. Rewrites are baked in at build time, so API_URL must be
 * set for the build as well as at runtime.
 */
const API_URL = process.env.API_URL ?? 'http://localhost:5001';

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
