import { ProviderError } from "@/lib/types";

const NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  googleMapsUri?: string;
};

type GoogleResponse = {
  places?: GooglePlace[];
  error?: { message?: string };
};

async function requestGoogle(
  url: string,
  body: object,
  fieldMask: string,
  apiKey: string,
): Promise<GoogleResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = (await response.json()) as GoogleResponse;
  if (!response.ok) {
    throw new ProviderError(
      payload.error?.message ??
        `Places API request failed (${response.status}).`,
      response.status,
    );
  }
  return payload;
}
