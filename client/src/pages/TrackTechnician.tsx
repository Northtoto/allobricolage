/**
 * Real-time Technician Tracking Page
 *
 * Allows clients to track their technician's location in real-time
 */

import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GoogleMapWrapper } from "@/components/tracking/GoogleMapWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Navigation, Clock, MapPin, Battery, AlertCircle } from "lucide-react";
import type { TrackingSession } from "@shared/schema";

export function TrackTechnician() {
  const [, params] = useRoute("/track/:bookingId");
  const [, navigate] = useLocation();
  const bookingId = params?.bookingId;

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch tracking data
  const { data: trackingData, isLoading, error, refetch } = useQuery<{ session: TrackingSession }>({
    queryKey: [`/api/tracking/booking/${bookingId}`],
    enabled: !!bookingId,
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
    retry: 3
  });

  const session: TrackingSession | undefined = trackingData?.session;

  // Manual refresh
  const handleRefresh = () => {
    refetch();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // Format ETA
  const formatETA = (eta: Date | string | null) => {
    if (!eta) return "Calcul en cours...";
    const etaDate = new Date(eta);
    const now = new Date();
    const diffMinutes = Math.round((etaDate.getTime() - now.getTime()) / 60000);

    if (diffMinutes < 1) return "Arrivée imminente";
    if (diffMinutes === 1) return "1 minute";
    return `${diffMinutes} minutes`;
  };

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  if (!bookingId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">ID de réservation manquant</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Chargement des données de suivi...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-semibold">Suivi non disponible</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Le technicien n'a pas encore activé le partage de localisation.
              Le suivi en temps réel sera disponible une fois qu'il aura démarré.
            </p>
            <Button onClick={handleRefresh}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session.isActive) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-gray-600 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-semibold">Session de suivi terminée</h3>
            </div>
            <p className="text-gray-600">
              Le suivi de cette réservation est terminé. Le technicien a probablement terminé son intervention.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasLocation = session.currentLocation !== null;

  // Prepare map markers
  const markers = [];

  // Technician marker (current location)
  if (hasLocation && session.currentLocation) {
    markers.push({
      position: {
        lat: session.currentLocation.latitude,
        lng: session.currentLocation.longitude
      },
      title: `${session.technicianName} (Technicien)`,
      label: "T",
      icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    });
  }

  // Destination marker (client location)
  markers.push({
    position: {
      lat: session.destination.latitude,
      lng: session.destination.longitude
    },
    title: "Destination",
    label: "D",
    icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
  });

  const mapCenter = hasLocation && session.currentLocation
    ? {
      lat: session.currentLocation.latitude,
      lng: session.currentLocation.longitude
    }
    : {
      lat: session.destination.latitude,
      lng: session.destination.longitude
    };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Suivi en temps réel</h1>
        <p className="text-gray-600">Suivez la position de votre technicien en direct</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Carte en temps réel</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={toggleAutoRefresh}
                >
                  {autoRefresh ? "Actualisation auto" : "Manuel"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <GoogleMapWrapper
                center={mapCenter}
                zoom={14}
                markers={markers}
                polyline={session.route?.polyline}
                className="w-full h-96 rounded-lg"
              />

              {!hasLocation && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800">
                    En attente de la première mise à jour de position du technicien...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          {/* Technician Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Technicien en route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-lg">{session.technicianName}</p>
                <a href={`tel:${session.technicianPhone}`} className="flex items-center gap-2 text-blue-600 hover:underline mt-2">
                  <Phone className="h-4 w-4" />
                  {session.technicianPhone}
                </a>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Destination</span>
                </div>
                <p className="text-sm text-gray-600">{session.destination.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* ETA & Distance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Arrivée estimée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {formatETA(session.estimatedArrival)}
                </p>
                {session.estimatedArrival && (
                  <p className="text-sm text-gray-600 mt-1">
                    Arrivée prévue à {new Date(session.estimatedArrival).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              {session.distanceRemaining > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Distance restante</p>
                  <p className="text-xl font-semibold">
                    {formatDistance(session.distanceRemaining)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Details */}
          {hasLocation && session.currentLocation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Détails de localisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {session.currentLocation.speed !== undefined && session.currentLocation.speed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vitesse:</span>
                    <span className="font-medium">{Math.round(session.currentLocation.speed)} km/h</span>
                  </div>
                )}

                {session.currentLocation.accuracy !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Précision GPS:</span>
                    <span className="font-medium">±{Math.round(session.currentLocation.accuracy)}m</span>
                  </div>
                )}

                {session.currentLocation.batteryLevel !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Batterie appareil:</span>
                    <div className="flex items-center gap-1">
                      <Battery className="h-4 w-4" />
                      <span className="font-medium">{session.currentLocation.batteryLevel}%</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Dernière mise à jour:</span>
                  <span className="font-medium">
                    {new Date(session.currentLocation.timestamp).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant="default" className="px-4 py-2">
              {autoRefresh ? "🟢 Suivi actif" : "⏸️ Suivi en pause"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
