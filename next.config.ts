import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for serverless (Vercel): pdfjs-dist needs @napi-rs/canvas
  // for Node.js canvas/DOMMatrix polyfills. Without this, PDF upload fails.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
};

export default nextConfig;
