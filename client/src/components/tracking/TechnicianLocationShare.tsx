/**
 * Technician Location Sharing Component
 *
 * Allows technicians to start/stop location sharing for active bookings
 */

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, MapPinOff, Navigation, Battery } from "lucide-react";

interface TechnicianLocationShareProps {
  bookingId: string;
  isInitiallyActive?: boolean;
}

export function TechnicianLocationShare({
  bookingId,
  isInitiallyActive = false
}: TechnicianLocationShareProps) {
  const [isActive, setIsActive] = useState(isInitiallyActive);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Start tracking session
  const startSession = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tracking/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
        credentials: "include"
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to start tracking session");
      }

      return res.json();
    },
    onSuccess: () => {
      setIsActive(true);
      startLocationTracking();
      toast({
        title: "Partage de localisation activé",
        description: "Le client peut maintenant suivre votre position en temps réel."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Stop tracking session
  const stopSession = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tracking/session/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
        credentials: "include"
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to stop tracking session");
      }

      return res.json();
    },
    onSuccess: () => {
      setIsActive(false);
      stopLocationTracking();
      toast({
        title: "Partage de localisation désactivé",
        description: "Le client ne peut plus suivre votre position."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update location
  const updateLocation = useMutation({
    mutationFn: async (position: GeolocationPosition) => {
      const res = await fetch("/api/tracking/location/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed !== null ? position.coords.speed * 3.6 : null, // m/s to km/h
          altitude: position.coords.altitude,
          batteryLevel
        }),
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error("Failed to update location");
      }

      return res.json();
    }
  });

  // Start location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre appareil ne supporte pas la géolocalisation.",
        variant: "destructive"
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition(position);
        updateLocation.mutate(position);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: "Erreur de localisation",
          description: "Impossible d'obtenir votre position. Vérifiez vos permissions.",
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    watchIdRef.current = watchId;
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setCurrentPosition(null);
  };

  // Get battery level
  useEffect(() => {
    const getBatteryLevel = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));

          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        } catch (error) {
          console.error("Battery API not available:", error);
        }
      }
    };

    getBatteryLevel();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Partage de localisation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium mb-1">
              {isActive ? "Partage actif" : "Partage désactivé"}
            </p>
            <p className="text-sm text-gray-600">
              {isActive
                ? "Le client peut suivre votre position en temps réel"
                : "Activez le partage pour que le client puisse vous suivre"}
            </p>
          </div>
          <Badge variant={isActive ? "default" : "outline"}>
            {isActive ? "🟢 Actif" : "⚫ Inactif"}
          </Badge>
        </div>

        {isActive && currentPosition && (
          <div className="p-3 bg-blue-50 rounded-lg space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Position actuelle</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Lat:</span>{" "}
                <span className="font-mono">{currentPosition.coords.latitude.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-600">Lng:</span>{" "}
                <span className="font-mono">{currentPosition.coords.longitude.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-600">Précision:</span>{" "}
                <span>±{Math.round(currentPosition.coords.accuracy)}m</span>
              </div>
              {batteryLevel !== null && (
                <div className="flex items-center gap-1">
                  <Battery className="h-3 w-3" />
                  <span>{batteryLevel}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!isActive ? (
            <Button
              onClick={() => startSession.mutate()}
              disabled={startSession.isPending}
              className="flex-1"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {startSession.isPending ? "Activation..." : "Activer le partage"}
            </Button>
          ) : (
            <Button
              onClick={() => stopSession.mutate()}
              disabled={stopSession.isPending}
              variant="destructive"
              className="flex-1"
            >
              <MapPinOff className="h-4 w-4 mr-2" />
              {stopSession.isPending ? "Arrêt..." : "Arrêter le partage"}
            </Button>
          )}
        </div>

        {isActive && (
          <p className="text-xs text-gray-500 text-center">
            💡 La localisation se met à jour automatiquement toutes les 5-10 secondes
          </p>
        )}
      </CardContent>
    </Card>
  );
}
