import type { NextConfig } from 'next';

/**
 * The browser only ever talks to the Next.js origin: /api is rewritten to the
 * Express API, so the auth cookie stays first-party even when the two apps are
 * deployed separately. Rewrites are baked in at build time, so API_URL must be
 * set for the build as well as at runtime.
 */
// `||`, not `??`: hosts can expose an unset variable as an empty string.
const API_URL = process.env.API_URL?.trim() || 'http://localhost:5001';

// On Vercel the localhost fallback can never work, and the build would still pass —
// every sign-in and app page would then fail at runtime. Say so loudly instead.
if (process.env.VERCEL && !process.env.API_URL?.trim()) {
  console.warn(
    [
      '',
      '⚠️  API_URL is not set for this Vercel build.',
      '    /api requests will be rewritten to http://localhost:5001 and fail.',
      '    Deploy the Express API (server/), then set API_URL in the Vercel project',
      '    settings — e.g. https://api.aaharsathi.in — and redeploy.',
      '',
    ].join('\n'),
  );
}

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
