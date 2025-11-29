/**
 * Real-time Technician Tracking Service
 *
 * Provides geolocation tracking functionality using Google Maps API
 * - Location updates from technicians
 * - Route calculation and ETA
 * - Distance matrix calculations
 * - Real-time tracking sessions
 */

import type {
  LocationUpdate,
  TrackingSession,
  RouteInfo,
  TechnicianLocation,
  JobAddress
} from "@shared/schema";

// Google Maps Directions API response types
interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      steps: Array<{
        html_instructions: string;
        distance: { value: number };
        duration: { value: number };
        start_location: { lat: number; lng: number };
        end_location: { lat: number; lng: number };
      }>;
    }>;
    overview_polyline: { points: string };
  }>;
  status: string;
}

// In-memory tracking sessions (in production, use Redis)
const activeSessions = new Map<string, TrackingSession>();

/**
 * Calculate route from technician to client using Google Maps Directions API
 */
export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteInfo | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("Google Maps API key not configured, using fallback distance calculation");
    // Fallback: Haversine formula for distance
    const distance = calculateHaversineDistance(origin, destination);
    const duration = Math.round((distance / 1000) * 120); // Assume 30 km/h avg speed in city

    return {
      distance,
      duration,
      polyline: "",
      steps: [{
        instruction: "Diriger vers la destination",
        distance,
        duration,
        startLocation: origin,
        endLocation: destination
      }]
    };
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.append("origin", `${origin.lat},${origin.lng}`);
    url.searchParams.append("destination", `${destination.lat},${destination.lng}`);
    url.searchParams.append("mode", "driving");
    url.searchParams.append("language", "fr");
    url.searchParams.append("key", apiKey);

    const response = await fetch(url.toString());
    const data: DirectionsResponse = await response.json();

    if (data.status !== "OK" || !data.routes.length) {
      console.error("Directions API error:", data.status);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distance: leg.distance.value,
      duration: leg.duration.value,
      polyline: route.overview_polyline.points,
      steps: leg.steps.map(step => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML tags
        distance: step.distance.value,
        duration: step.duration.value,
        startLocation: step.start_location,
        endLocation: step.end_location
      }))
    };
  } catch (error) {
    console.error("Error calculating route:", error);
    return null;
  }
}

/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in meters
 */
function calculateHaversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Start a new tracking session for a booking
 */
export function startTrackingSession(
  bookingId: string,
  technicianId: string,
  technicianName: string,
  technicianPhone: string,
  destination: JobAddress
): TrackingSession {
  const session: TrackingSession = {
    bookingId,
    technicianId,
    technicianName,
    technicianPhone,
    currentLocation: null,
    destination: {
      address: destination.address,
      latitude: destination.latitude,
      longitude: destination.longitude
    },
    estimatedArrival: null,
    distanceRemaining: 0,
    durationRemaining: 0,
    isActive: true
  };

  activeSessions.set(bookingId, session);
  return session;
}

/**
 * Update technician location and recalculate ETA
 */
export async function updateTechnicianLocation(
  bookingId: string,
  location: LocationUpdate
): Promise<TrackingSession | null> {
  const session = activeSessions.get(bookingId);

  if (!session || !session.isActive) {
    return null;
  }

  // Update current location
  session.currentLocation = location;

  // Calculate route to destination
  const route = await calculateRoute(
    { lat: location.latitude, lng: location.longitude },
    { lat: session.destination.latitude, lng: session.destination.longitude }
  );

  if (route) {
    session.route = {
      polyline: route.polyline,
      distance: route.distance,
      duration: route.duration
    };
    session.distanceRemaining = route.distance;
    session.durationRemaining = route.duration;

    // Calculate estimated arrival time
    const eta = new Date();
    eta.setSeconds(eta.getSeconds() + route.duration);
    session.estimatedArrival = eta;
  }

  activeSessions.set(bookingId, session);
  return session;
}

/**
 * Get tracking session for a booking
 */
export function getTrackingSession(bookingId: string): TrackingSession | null {
  return activeSessions.get(bookingId) || null;
}

/**
 * Stop tracking session
 */
export function stopTrackingSession(bookingId: string): void {
  const session = activeSessions.get(bookingId);
  if (session) {
    session.isActive = false;
    activeSessions.set(bookingId, session);
  }
}

/**
 * Get all active tracking sessions for a technician
 */
export function getTechnicianActiveSessions(technicianId: string): TrackingSession[] {
  return Array.from(activeSessions.values())
    .filter(session => session.technicianId === technicianId && session.isActive);
}

/**
 * Geocode an address to coordinates using Google Maps Geocoding API
 */
export async function geocodeAddress(address: string, city: string): Promise<{
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId: string;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("Google Maps API key not configured, cannot geocode address");
    // Return default coordinates for major Moroccan cities
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      "Casablanca": { lat: 33.5731, lng: -7.5898 },
      "Rabat": { lat: 34.0209, lng: -6.8416 },
      "Marrakech": { lat: 31.6295, lng: -7.9811 },
      "Fès": { lat: 34.0181, lng: -5.0078 },
      "Tanger": { lat: 35.7595, lng: -5.8340 },
      "Agadir": { lat: 30.4278, lng: -9.5981 },
      "Meknès": { lat: 33.8935, lng: -5.5473 },
      "Oujda": { lat: 34.6867, lng: -1.9114 },
      "Kenitra": { lat: 34.2610, lng: -6.5802 },
      "Tétouan": { lat: 35.5889, lng: -5.3626 }
    };

    const coords = cityCoordinates[city] || cityCoordinates["Casablanca"];
    return {
      latitude: coords.lat,
      longitude: coords.lng,
      formattedAddress: `${address}, ${city}, Maroc`,
      placeId: ""
    };
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("address", `${address}, ${city}, Maroc`);
    url.searchParams.append("language", "fr");
    url.searchParams.append("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" || !data.results.length) {
      console.error("Geocoding API error:", data.status);
      return null;
    }

    const result = data.results[0];

    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

/**
 * Calculate ETA based on current location and destination
 */
export function calculateETA(
  currentLocation: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  averageSpeedKmh: number = 30 // Default urban speed
): Date {
  const distance = calculateHaversineDistance(currentLocation, destination);
  const durationSeconds = (distance / 1000) / averageSpeedKmh * 3600;

  const eta = new Date();
  eta.setSeconds(eta.getSeconds() + durationSeconds);

  return eta;
}
