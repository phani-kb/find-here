import type { NextConfig } from "next";

const REQUIRED_ENV_VARS = [
  "GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID",
] as const;

const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}. Copy .env.example to .env.local and fill it in.`,
  );
}

const nextConfig: NextConfig = {/* config options here */};

export default nextConfig;
