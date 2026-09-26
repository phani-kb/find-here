import { NextResponse } from "next/server";

import { geocodeGoogle } from "@/lib/google";
import { ProviderError, type GeocodeRequest } from "@/lib/types";

export async function POST(request: Request) {
  let body: Partial<GeocodeRequest>;
  try {
    body = (await request.json()) as Partial<GeocodeRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json(
      { error: "`query` must be a non-empty string." },
      { status: 400 },
    );
  }

  try {
    const result = await geocodeGoogle(query);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ProviderError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Geocoding failed." }, { status: 502 });
  }
}
