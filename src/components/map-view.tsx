"use client";

import { useEffect } from "react";
import {
  AdvancedMarker,
  APIProvider,
  Circle,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";

import { circleBounds } from "@/lib/geo";
import type { LatLng, PlaceResult } from "@/lib/types";

export type MapViewProps = {
  center: LatLng;
  fitCenter: LatLng;
  radiusMeters: number;
  results: PlaceResult[];
  selectedId: string | null;
  onCenterAction: (center: LatLng) => void;
  onSelectAction: (id: string) => void;
};

const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

function FitToCircle({
  center,
  radiusMeters,
}: {
  center: LatLng;
  radiusMeters: number;
}) {
  const map = useMap();
  const { lat, lng } = center;

  useEffect(() => {
    if (!map) return;
    map.fitBounds(circleBounds({ lat, lng }, radiusMeters), 48);
  }, [map, lat, lng, radiusMeters]);

  return null;
}

export default function MapView({
  center,
  fitCenter,
  radiusMeters,
  results,
  selectedId,
  onCenterAction,
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

  if (!MAP_ID) {
    return (
      <div className="grid h-full place-items-center bg-zinc-100 p-8 text-center text-sm text-zinc-600">
        Set{" "}
        <code className="mx-1 rounded bg-black/10 px-1">
          NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
        </code>{" "}
        to render pins — AdvancedMarker needs a real Map ID.
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
          onClick={(event) => {
            const latLng = event.detail.latLng;
            if (latLng) onCenterAction({ lat: latLng.lat, lng: latLng.lng });
          }}
        >
          <FitToCircle center={fitCenter} radiusMeters={radiusMeters} />

          <Circle
            center={center}
            radius={radiusMeters}
            strokeColor="#2563eb"
            strokeOpacity={0.9}
            strokeWeight={2}
            fillColor="#3b82f6"
            fillOpacity={0.12}
          />

          <AdvancedMarker
            position={center}
            draggable
            onDragEnd={(event) => {
              const latLng = event.latLng;
              if (latLng)
                onCenterAction({ lat: latLng.lat(), lng: latLng.lng() });
            }}
          >
            <Pin background="#2563eb" borderColor="#1e40af" glyphColor="#fff" />
          </AdvancedMarker>

          {results.map((place) => (
            <AdvancedMarker
              key={place.id}
              position={place.location}
              title={place.name}
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
