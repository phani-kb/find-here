import { NextResponse } from "next/server";

import { isValidLatLng } from "@/lib/geo";
import { searchGoogle } from "@/lib/google";
import { ProviderError, type SearchRequest } from "@/lib/types";

export async function POST(request: Request) {
  let body: Partial<SearchRequest>;
  try {
    body = (await request.json()) as Partial<SearchRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { center } = body;
  if (!isValidLatLng(center)) {
    return NextResponse.json(
      { error: "`center` must be a valid { lat, lng }." },
      { status: 400 },
    );
  }

  try {
    const results = await searchGoogle(center, 5_000);
    return NextResponse.json({
      center,
      radiusMeters: 5_000,
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
