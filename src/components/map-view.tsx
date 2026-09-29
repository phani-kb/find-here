"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  Pin,
} from "@vis.gl/react-google-maps";

import type { LatLng, PlaceResult } from "@/lib/types";

export type MapViewProps = {
  center: LatLng;
  results: PlaceResult[];
  selectedId: string | null;
  onSelectAction: (id: string) => void;
};

const FALLBACK_MAP_ID = "DEMO_MAP_ID";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? FALLBACK_MAP_ID;
if (MAP_ID === FALLBACK_MAP_ID) {
  console.warn(
    "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID is not set; using DEMO_MAP_ID. Create a Map ID.",
  );
}

export default function MapView({
  center,
  results,
  selectedId,
  onSelectAction,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="grid h-full place-items-center bg-zinc-100 p-8 text-center text-sm text-zinc-600">
        Set{" "}
        <code className="mx-1 rounded bg-black/10 px-1">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </code>{" "}
        to render the map.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <APIProvider apiKey={apiKey}>
        <Map
          mapId={MAP_ID}
          defaultCenter={center}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {results.map((place) => (
            <AdvancedMarker
              key={place.id}
              position={place.location}
              onClick={() => onSelectAction(place.id)}
            >
              <Pin
                background={place.id === selectedId ? "#dc2626" : "#f59e0b"}
                borderColor={place.id === selectedId ? "#991b1b" : "#b45309"}
                glyphColor="#fff"
                scale={place.id === selectedId ? 1.5 : 1}
              />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
