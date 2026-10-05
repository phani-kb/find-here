export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
export const PHOTON_URL = "https://photon.komoot.io/api/";
export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const OSM_POI_KEYS = [
  "amenity",
  "shop",
  "tourism",
  "leisure",
  "office",
  "craft",
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

export type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};
