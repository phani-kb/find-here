import { haversineMeters, sortByDistance } from "@/lib/geo";
import {
  type GeocodeResponse,
  type LatLng,
  type PlaceResult,
  ProviderError,
} from "@/lib/types";

const NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
const TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
const PAGE_SIZE = 20;
const MAX_PAGES = 3;
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
  nextPageToken?: string;
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
  const data = await parseGoogleResponse(response);
  if (!response.ok) {
    throw new ProviderError(
      data.error?.message ??
        `Places API request failed (${response.status}${response.statusText ? ` ${response.statusText}` : ""}).`,
      response.status,
    );
  }
  return data;
}

async function parseGoogleResponse(
  response: Response,
): Promise<GoogleResponse> {
  try {
    return (await response.json()) as GoogleResponse;
  } catch {
    return {};
  }
}

// Geocoding API returns coordinates + address but not a label unlike the places text search
export async function geocodeGoogle(query: string): Promise<GeocodeResponse> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new ProviderError("Server is missing GOOGLE_MAPS_API_KEY.", 500);
  }

  const data = await requestGoogle(
    TEXT_URL,
    { textQuery: query, pageSize: 1 },
    "places.displayName,places.formattedAddress,places.location",
    apiKey,
  );

  const place = data.places?.[0];
  const { latitude: lat, longitude: lng } = place?.location ?? {};
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new ProviderError(`No location found for "${query}".`, 404);
  }

  return {
    center: { lat, lng },
    label: place?.displayName?.text ?? place?.formattedAddress ?? query,
  };
}

export async function searchGoogle(
  center: LatLng,
  radiusMeters: number = 5_000,
  keyword: string = "",
  minRating: number = 0,
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new ProviderError("Server is missing GOOGLE_MAPS_API_KEY.", 500);
  }

  if (!keyword) {
    const data = await requestGoogle(
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
    return keepInCircle(data.places ?? [], center, radiusMeters);
  }

  const textBody = {
    textQuery: keyword,
    pageSize: PAGE_SIZE,
    ...(minRating > 0 ? { minRating } : {}),
    locationBias: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: radiusMeters,
      },
    },
  };

  const places: GooglePlace[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await requestGoogle(
      TEXT_URL,
      { ...textBody, ...(pageToken ? { pageToken } : {}) },
      `${PLACE_FIELD_MASK},nextPageToken`,
      apiKey,
    );
    places.push(...(data.places ?? []));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return keepInCircle(places, center, radiusMeters);
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
