"use client";

import { formatDistance } from "@/lib/geo";
import type { PlaceResult } from "@/lib/types";

type ResultsPanelProps = {
  results: PlaceResult[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  radiusLabel: string;
};

export default function ResultsPanel({
  results,
  status,
  error,
  radiusLabel,
}: ResultsPanelProps) {
  const countLabel = `${results.length} place(s)`;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Results</h2>
        <p aria-live="polite" className="text-xs text-zinc-500">
          {status === "idle"
            ? "No search yet"
            : status === "loading"
              ? "Searching..."
              : status === "error"
                ? "Search failed"
                : `${countLabel} within ${radiusLabel}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {status === "error" && (
          <p className="p-4 text-sm text-red-600">{error}</p>
        )}

        {status === "ready" && results.length === 0 && (
          <p className="p-4 text-sm text-zinc-500">
            No places found in this circle. Try a larger radius or a different
            center.
          </p>
        )}

        {results.length > 0 && (
          <ul className="divide-y divide-zinc-100">
            {results.map((place) => (
              <li key={place.id}>
                <div className="flex items-start gap-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {place.name}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                        {formatDistance(place.distanceMeters)}
                      </span>
                    </div>
                    {place.address && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                        {place.address}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                      {typeof place.rating === "number" && (
                        <span>
                          ★ {place.rating.toFixed(1)}
                          {typeof place.userRatingCount === "number"
                            ? ` (${place.userRatingCount})`
                            : ""}
                        </span>
                      )}
                      {place.primaryType && (
                        <span className="truncate">
                          {place.primaryType.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
