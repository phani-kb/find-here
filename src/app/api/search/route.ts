import { NextResponse } from "next/server";

import { enforceRateLimit } from "@/lib/api-guard";
import { isValidLatLng, MAX_RADIUS_METERS } from "@/lib/geo";
import { searchGoogle } from "@/lib/google";
import { SEARCH_RATE_LIMIT } from "@/lib/rate-limit";
import { ProviderError, type SearchRequest } from "@/lib/types";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "search", SEARCH_RATE_LIMIT);
  if (limited) return limited;

  let body: Partial<SearchRequest>;
  try {
    body = (await request.json()) as Partial<SearchRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { center, radiusMeters, keyword, minRating } = body;
  if (!isValidLatLng(center)) {
    return NextResponse.json(
      { error: "`center` must be a valid { lat, lng }." },
      { status: 400 },
    );
  }
  if (
    typeof radiusMeters !== "number" ||
    !Number.isFinite(radiusMeters) ||
    radiusMeters <= 0 ||
    radiusMeters > MAX_RADIUS_METERS
  ) {
    return NextResponse.json(
      {
        error: `\`radiusMeters\` must be between 1 and ${MAX_RADIUS_METERS} (Google Places limit).`,
      },
      { status: 400 },
    );
  }

  const trimmedKeyword = typeof keyword === "string" ? keyword.trim() : "";
  const validMinRating =
    typeof minRating === "number" &&
    Number.isFinite(minRating) &&
    minRating >= 0 &&
    minRating <= 5
      ? minRating
      : 0;

  try {
    const results = await searchGoogle(
      center,
      radiusMeters,
      trimmedKeyword,
      validMinRating,
    );
    return NextResponse.json({
      center,
      radiusMeters,
      count: results.length,
      results,
    });
  } catch (error) {
    if (error instanceof ProviderError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Search failed." }, { status: 502 });
  }
}
