import { haversineMeters, sortByDistance } from "@/lib/geo";
import { type LatLng, type PlaceResult, ProviderError } from "@/lib/types";

const NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
const MAX_RESULTS = 20;
const PLACE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.primaryType",
  "places.googleMapsUri",
].join(",");

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

function toPlaceResult(place: GooglePlace, center: LatLng): PlaceResult | null {
  const { latitude: lat, longitude: lng } = place.location ?? {};
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const location = { lat, lng };
  return {
    id: place.id ?? `${lat},${lng}`,
    name: place.displayName?.text ?? "Unnamed place",
    address: place.formattedAddress ?? "",
    location,
    distanceMeters: haversineMeters(center, location),
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    primaryType: place.primaryType,
    ...(place.googleMapsUri
      ? {
          mapLink: {
            href: place.googleMapsUri,
            label: "Open in Maps",
          },
        }
      : {}),
  };
}

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

export async function searchGoogle(
  center: LatLng,
  radiusMeters: number,
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new ProviderError("Server is missing GOOGLE_MAPS_API_KEY.", 500);
  }

  const payload = await requestGoogle(
    NEARBY_URL,
    {
      maxResultCount: MAX_RESULTS,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: radiusMeters,
        },
      },
    },
    PLACE_FIELD_MASK,
    apiKey,
  );
  return keepInCircle(payload.places ?? [], center, radiusMeters);
}

function keepInCircle(
  places: GooglePlace[],
  center: LatLng,
  radiusMeters: number,
): PlaceResult[] {
  const seen = new Set<string>();
  return sortByDistance(
    places
      .map((place) => toPlaceResult(place, center))
      .filter((place): place is PlaceResult => place !== null)
      .filter((place) => place.distanceMeters <= radiusMeters)
      .filter((place) => !seen.has(place.id) && !!seen.add(place.id)),
  ).slice(0, MAX_RESULTS);
}
