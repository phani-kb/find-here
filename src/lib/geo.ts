export const METERS_PER_MILE = 1609.344;

// google api cap at 50k meters, ~31 mi
export const RADIUS_OPTIONS_MILES = [1, 2, 3, 5, 10, 15, 20, 25, 30] as const;

export const MAX_RADIUS_METERS = 50_000;

export const DEFAULT_RADIUS_MILES = 5;

export const MILES_TO_METERS = (miles: number) =>
  Math.round(miles * METERS_PER_MILE);

export const METERS_TO_MILES = (meters: number) => meters / METERS_PER_MILE;
