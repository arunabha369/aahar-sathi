import path from 'node:path';
import type { NextConfig } from 'next';

// The Express API in ../server runs inside this app (pages/api/[...path].ts), so both
// Turbopack and the deployment file tracer must look one level up, at the monorepo root.
const monorepoRoot = path.join(__dirname, '..');

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: { root: monorepoRoot },
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
