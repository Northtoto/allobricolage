import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Navigation, CheckCircle, Phone, ArrowLeft, ExternalLink, Car } from "lucide-react";
import { GoogleMapWrapper } from "@/components/tracking/GoogleMapWrapper";

export default function TechnicianJobTracking() {
  const [, params] = useRoute("/technician/track/:bookingId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bookingId = params?.bookingId;

  const { data: booking, isLoading } = useQuery<any>({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId
  });

  const [techLocation, setTechLocation] = useState({ lat: 33.5731 - 0.01, lng: -7.5898 - 0.01 });
  const [simulationActive, setSimulationActive] = useState(false);
  const [progress, setProgress] = useState(0);

  // Client location (destination) - default to Casablanca center
  const clientLocation = { lat: 33.5731, lng: -7.5898 };
  const defaultCenter = { lat: 33.5731, lng: -7.5898 };

  const updateLocationMutation = useMutation({
    mutationFn: async (location: { lat: number, lng: number }) => {
      await apiRequest("POST", "/api/tracking/location/update", {
        bookingId,
        latitude: location.lat,
        longitude: location.lng,
        speed: 40,
        heading: 0,
        accuracy: 10,
        altitude: 0,
        batteryLevel: 95
      });
    },
    onError: (err) => console.error("Location update failed", err)
  });

  // Simulation logic
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(() => {
      setTechLocation(prev => {
        const latDiff = clientLocation.lat - prev.lat;
        const lngDiff = clientLocation.lng - prev.lng;
        
        // If close enough, stop
        if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
          setSimulationActive(false);
          setProgress(100);
          toast({ title: "Vous êtes arrivé à destination!" });
          return clientLocation;
        }
        
        // Move 10% closer each step
        const newLocation = {
          lat: prev.lat + latDiff * 0.1,
          lng: prev.lng + lngDiff * 0.1
        };
        
        // Send update to server (fire and forget)
        updateLocationMutation.mutate(newLocation);
        
        return newLocation;
      });
      setProgress(p => Math.min(p + 5, 100)); // Update progress bar
    }, 2000); // Slower interval to be nicer to DB (2s)

    return () => clearInterval(interval);
  }, [simulationActive]);

  const startSimulation = () => {
    setSimulationActive(true);
    toast({ title: "Simulation du trajet démarrée" });
  };

  const completeJobMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/bookings/${bookingId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Mission terminée!",
        description: "La facture a été générée et envoyée au client.",
      });
      setLocation("/technician-dashboard");
    },
    onError: (error) => {
      console.error("Completion error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de terminer la mission.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) {
    return <div>Réservation introuvable</div>;
  }

  const markers = [
    {
      position: clientLocation,
      title: "Client",
      label: "C",
      icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
    },
    {
      position: techLocation,
      title: "Moi",
      icon: "https://cdn-icons-png.flaticon.com/64/3097/3097180.png" // Car icon
    }
  ];

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${clientLocation.lat},${clientLocation.lng}`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Button variant="ghost" className="mb-4" onClick={() => setLocation("/technician-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Localisation du chantier
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  {simulationActive && (
                    <div className="absolute top-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-blue-100 z-10 flex items-center justify-between animate-in slide-in-from-top-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2.5 rounded-full text-white shadow-lg">
                          <Car className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">En route vers le client</p>
                          <p className="text-sm text-blue-600 font-medium">
                            Arrivée estimée: {Math.max(1, Math.ceil((100 - progress) / 10))} min
                          </p>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Distance</p>
                        <p className="font-mono font-bold text-xl">{((100 - progress) * 50).toFixed(0)} m</p>
                      </div>
                    </div>
                  )}

                  {(simulationActive || progress > 0) && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progression du trajet</span>
                        <span className="font-medium text-blue-600">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <div className="h-80 rounded-lg overflow-hidden mb-4 border">
                    <GoogleMapWrapper
                      center={defaultCenter}
                      zoom={13}
                      markers={markers}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={startSimulation} disabled={simulationActive || progress === 100}>
                      <Navigation className="mr-2 h-4 w-4" />
                      {simulationActive ? "En route..." : progress === 100 ? "Arrivé" : "Simuler Trajet"}
                    </Button>
                    {booking.clientPhone && (
                      <Button variant="outline" asChild>
                        <a href={`tel:${booking.clientPhone}`}>
                          <Phone className="mr-2 h-4 w-4" />
                          Appeler Client
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Détails de la mission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-500 text-sm">Client</h3>
                    <p className="text-lg">{booking.clientName}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-500 text-sm">Adresse (Ville)</h3>
                    <p className="text-lg">{booking.city || "Casablanca"}</p>
                    {/* Note: In real app, full address would be here */}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-500 text-sm">Description</h3>
                    <p>{booking.matchExplanation || "Intervention technique"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statut</CardTitle>
                  <CardDescription>Gérez l'avancement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Mission en cours</span>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="mb-4 text-sm text-gray-600">
                      Une fois le travail terminé, validez pour générer la facture et permettre au client de vous noter.
                    </p>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      size="lg"
                      onClick={() => completeJobMutation.mutate()}
                      disabled={completeJobMutation.isPending}
                    >
                      {completeJobMutation.isPending ? "Validation..." : "Terminer la mission"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-gray-600">
                    <li>• Vérifiez l'identité du client</li>
                    <li>• Prenez des photos avant/après</li>
                    <li>• Ne demandez pas de paiement direct hors plateforme</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

