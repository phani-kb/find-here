import type { NextConfig } from "next";

const REQUIRED_ENV_VARS = [
  "GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID",
] as const;

function isPlaceholder(value: string): boolean {
  return /^<.*>$/.test(value.trim());
}

const invalid = REQUIRED_ENV_VARS.filter((name) => {
  const value = process.env[name];
  return !value || isPlaceholder(value);
});

if (invalid.length > 0) {
  throw new Error(
    `Missing or placeholder value for: ${invalid.join(", ")}. Copy .env.example to .env.local and fill in real values.`,
  );
}

const nextConfig: NextConfig = {/* config options here */};

export default nextConfig;
