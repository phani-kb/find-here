import { haversineMeters, sortByDistance } from "@/lib/geo";
import type { LatLng, PlaceResult } from "@/lib/types";

export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
export const PHOTON_URL = "https://photon.komoot.io/api/";
export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const OSM_POI_KEYS = [
  "amenity",
  "shop",
  "tourism",
  "leisure",
  "office",
  "historic",
  "healthcare",
  "sport",
  "public_transport",
] as const;

export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export type OverpassResponse = {
  elements?: OverpassElement[];
};

export function buildOsmAddress(tags?: Record<string, string>): string {
  if (!tags) return "";
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
  ].filter((part): part is string => Boolean(part?.trim()));
  return parts.join(" ");
}

export function primaryTypeOf(
  tags?: Record<string, string>,
): string | undefined {
  if (!tags) return undefined;
  for (const key of OSM_POI_KEYS) {
    const value = tags[key];
    if (value) return value;
  }
  return undefined;
}

export function overpassElementToPlace(
  element: OverpassElement,
  center: LatLng,
): PlaceResult | null {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  const name = element.tags?.name?.trim();

  if (typeof lat !== "number" || typeof lng !== "number" || !name) {
    return null;
  }

  const location: LatLng = { lat, lng };

  return {
    id: `${element.type}/${element.id}`,
    name,
    address: buildOsmAddress(element.tags),
    location,
    distanceMeters: haversineMeters(center, location),
    primaryType: primaryTypeOf(element.tags),
    mapLink: {
      href: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=19/${lat}/${lng}`,
      label: "Open in OpenStreetMap",
    },
  };
}

export function overpassToPlaces(
  response: OverpassResponse,
  center: LatLng,
  radiusMeters: number,
  limit: number,
  keyword = "",
): PlaceResult[] {
  const kw = keyword.trim().toLowerCase();

  const places = (response.elements ?? [])
    .map((element) => overpassElementToPlace(element, center))
    .filter((place): place is PlaceResult => place !== null)
    .filter((place) => !kw || place.name.toLowerCase().includes(kw))
    .filter((place) => place.distanceMeters <= radiusMeters);

  return sortByDistance(places).slice(0, limit);
}
