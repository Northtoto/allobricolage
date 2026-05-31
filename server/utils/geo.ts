/**
 * Haversine distance calculation for geospatial matching.
 * Returns distance in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find all technicians within a radius (in km) of a location.
 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
  id: string;
  data?: Record<string, unknown>;
}

export function findWithinRadius(
  centerLat: number,
  centerLng: number,
  points: GeoPoint[],
  radiusKm: number
): Array<GeoPoint & { distance: number }> {
  const results = [];
  for (const point of points) {
    const dist = haversineDistance(centerLat, centerLng, point.latitude, point.longitude);
    if (dist <= radiusKm) {
      results.push({ ...point, distance: dist });
    }
  }
  // Sort by distance, nearest first
  return results.sort((a, b) => a.distance - b.distance);
}

/**
 * Score a technician based on proximity to client.
 * Returns score between 0 and 1 (closer = higher score).
 */
export function proximityScore(
  clientLat: number,
  clientLng: number,
  techLat: number,
  techLng: number,
  maxAcceptableKm: number = 50
): number {
  const dist = haversineDistance(clientLat, clientLng, techLat, techLng);
  if (dist <= 1) return 1.0;
  if (dist >= maxAcceptableKm) return 0.0;
  return 1 - (dist / maxAcceptableKm);
}
