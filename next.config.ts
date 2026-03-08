import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed @pinata/sdk from serverExternalPackages to avoid Set serialization
  // error when passing from Server to Client Components (Next.js dev mode bug).
  // The SDK works when bundled. If you hit module resolution issues, you can
  // migrate to the new "pinata" package (uses PINATA_JWT env var).
};

export default nextConfig;
