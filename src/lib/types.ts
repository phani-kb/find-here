export type LatLng = {
  lat: number;
  lng: number;
};

export type Provider = "google" | "osm";

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type MapLink = {
  href: string;
  label: string;
};

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  distanceMeters: number;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  mapLink?: MapLink;
};

export type SearchRequest = {
  center: LatLng;
  radiusMeters: number;
  keyword?: string;
  minRating?: number;
  provider?: Provider;
};

export type SearchResponse = {
  center: LatLng;
  radiusMeters: number;
  count: number;
  results: PlaceResult[];
};

export type GeocodeRequest = {
  query: string;
  provider?: Provider;
};

export type GeocodeResponse = {
  label: string;
  center: LatLng;
};
