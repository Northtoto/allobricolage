/**
 * Google Maps Wrapper Component
 *
 * Provides a reusable Google Maps component with marker support
 */

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface GoogleMapWrapperProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
    label?: string;
  }>;
  polyline?: string; // Encoded polyline from Google Directions API
  className?: string;
  onMapLoad?: (map: google.maps.Map) => void;
}

export function GoogleMapWrapper({
  center,
  zoom = 13,
  markers = [],
  polyline,
  className = "w-full h-96",
  onMapLoad
}: GoogleMapWrapperProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markersInstances, setMarkersInstances] = useState<google.maps.Marker[]>([]);
  const [polylineInstance, setPolylineInstance] = useState<google.maps.Polyline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError("Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.");
      setLoading(false);
      return;
    }

    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "geometry"]
    });

    loader.load().then((google) => {
      if (mapRef.current) {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true
        });

        setMap(mapInstance);
        setLoading(false);

        if (onMapLoad) {
          onMapLoad(mapInstance);
        }
      }
    }).catch((err: Error) => {
      console.error("Error loading Google Maps:", err);
      setError("Failed to load Google Maps. Please check your API key and internet connection.");
      setLoading(false);
    });
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (map) {
      map.setCenter(center);
    }
  }, [map, center]);

  // Update markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersInstances.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = markers.map(markerData => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
        label: markerData.label,
        icon: markerData.icon
      });

      return marker;
    });

    setMarkersInstances(newMarkers);

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach(marker => bounds.extend(marker.position));
      map.fitBounds(bounds);
    }
  }, [map, markers]);

  // Update polyline (route)
  useEffect(() => {
    if (!map || !polyline) return;

    // Clear existing polyline
    if (polylineInstance) {
      polylineInstance.setMap(null);
    }

    // Decode polyline and create new one
    const decodedPath = google.maps.geometry.encoding.decodePath(polyline);

    const newPolyline = new google.maps.Polyline({
      path: decodedPath,
      geodesic: true,
      strokeColor: "#4285F4",
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map
    });

    setPolylineInstance(newPolyline);

    // Fit bounds to show entire route
    const bounds = new google.maps.LatLngBounds();
    decodedPath.forEach((point: google.maps.LatLng) => bounds.extend(point));
    map.fitBounds(bounds);
  }, [map, polyline]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300`}>
        <div className="text-center p-6">
          <p className="text-red-600 font-semibold mb-2">Erreur de chargement de la carte</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
}
