import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray lockfile in a parent dir
  // otherwise confuses Next's root inference (file tracing + Turbopack), which
  // would surface as wrong/missing files on the Vercel deploy.
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
