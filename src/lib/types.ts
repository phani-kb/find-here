export type LatLng = {
  lat: number;
  lng: number;
};

export type Provider = "google" | "osm";

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  distanceMeters: number;
  rating?: number;
  userRatingCount?: number;
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
