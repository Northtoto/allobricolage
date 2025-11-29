import { useQuery } from "@tanstack/react-query";
import { TechnicianCard } from "@/components/technician/TechnicianCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { useState } from "react";
import type { TechnicianWithUser } from "@shared/schema";
import { SERVICE_CATEGORIES, MOROCCAN_CITIES } from "@shared/schema";
import { getServiceLabel } from "@/lib/serviceLabels";

export default function TechnicianDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const { data: technicians, isLoading } = useQuery<TechnicianWithUser[]>({
    queryKey: ['/api/technicians'],
  });

  const filteredTechnicians = technicians?.filter(tech => {
    const matchesSearch = !searchQuery || 
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesService = !selectedService || 
      tech.services.includes(selectedService);
    
    const matchesCity = !selectedCity || 
      tech.city?.toLowerCase() === selectedCity.toLowerCase();
    
    return matchesSearch && matchesService && matchesCity;
  }) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="bg-primary/5 border-b">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <h1 
              className="text-3xl font-bold text-foreground mb-2"
              data-testid="text-directory-title"
            >
              Annuaire des Techniciens
            </h1>
            <p className="text-muted-foreground mb-6">
              Trouvez le technicien parfait pour vos travaux
            </p>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou compétence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-technicians"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtres
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 shrink-0">
              <Card className="p-4 sticky top-4">
                <h3 className="font-semibold text-foreground mb-4">Services</h3>
                <div className="space-y-2 mb-6">
                  <button
                    onClick={() => setSelectedService(null)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      !selectedService 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                    data-testid="filter-all-services"
                  >
                    Tous les services
                  </button>
                  {SERVICE_CATEGORIES.map(service => (
                    <button
                      key={service}
                      onClick={() => setSelectedService(service)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedService === service 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                      data-testid={`filter-service-${service}`}
                    >
                      {getServiceLabel(service)}
                    </button>
                  ))}
                </div>

                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ville
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCity(null)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      !selectedCity 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                    data-testid="filter-all-cities"
                  >
                    Toutes les villes
                  </button>
                  {MOROCCAN_CITIES.map(city => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCity === city 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                      data-testid={`filter-city-${city}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </Card>
            </aside>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  {filteredTechnicians.length} technicien{filteredTechnicians.length !== 1 ? 's' : ''} trouvé{filteredTechnicians.length !== 1 ? 's' : ''}
                </p>
                {(selectedService || selectedCity) && (
                  <div className="flex gap-2">
                    {selectedService && (
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={() => setSelectedService(null)}
                      >
                        {getServiceLabel(selectedService)} ×
                      </Badge>
                    )}
                    {selectedCity && (
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={() => setSelectedCity(null)}
                      >
                        {selectedCity} ×
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredTechnicians.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Aucun technicien trouvé avec ces critères
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedService(null);
                      setSelectedCity(null);
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </Card>
              ) : (
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  data-testid="grid-technicians"
                >
                  {filteredTechnicians.map(tech => (
                    <TechnicianCard key={tech.id} technician={tech} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
