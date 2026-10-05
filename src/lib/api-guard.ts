import { NextResponse } from "next/server";

import {
  getClientKey,
  rateLimit,
  type RateLimitOptions,
} from "@/lib/rate-limit";

export function enforceRateLimit(
  request: Request,
  scope: string,
  options: RateLimitOptions,
): NextResponse | null {
  const result = rateLimit(`${scope}:${getClientKey(request)}`, options);

  if (result.allowed) return null;

  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  );
}
