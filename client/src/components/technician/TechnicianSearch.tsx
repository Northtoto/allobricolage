import { useState } from "react";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const SERVICES = [
  { value: "all", label: "Tous les services" },
  { value: "plomberie", label: "Plomberie" },
  { value: "electricite", label: "Électricité" },
  { value: "menuiserie", label: "Menuiserie" },
  { value: "peinture", label: "Peinture" },
  { value: "nettoyage", label: "Nettoyage" },
  { value: "climatisation", label: "Climatisation" },
];

const CITIES = [
  { value: "all", label: "Toutes les villes" },
  { value: "Casablanca", label: "Casablanca" },
  { value: "Rabat", label: "Rabat" },
  { value: "Marrakech", label: "Marrakech" },
  { value: "Fès", label: "Fès" },
  { value: "Tanger", label: "Tanger" },
  { value: "Agadir", label: "Agadir" },
];

const SORT_OPTIONS = [
  { value: "rating", label: "Meilleure note" },
  { value: "reviews", label: "Plus d'avis" },
  { value: "experience", label: "Plus d'expérience" },
  { value: "price-low", label: "Prix croissant" },
  { value: "price-high", label: "Prix décroissant" },
];

interface TechnicianSearchProps {
  onSearch: (params: {
    search: string;
    city: string;
    service: string;
    minRating: number;
    available: boolean;
    sortBy: string;
  }) => void;
}

export function TechnicianSearch({ onSearch }: TechnicianSearchProps) {
  const [searchText, setSearchText] = useState("");
  const [city, setCity] = useState("all");
  const [service, setService] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating");

  const handleSearch = () => {
    onSearch({
      search: searchText,
      city,
      service,
      minRating,
      available: availableOnly,
      sortBy,
    });
  };

  const handleReset = () => {
    setSearchText("");
    setCity("all");
    setService("all");
    setMinRating(0);
    setAvailableOnly(false);
    setSortBy("rating");
    onSearch({
      search: "",
      city: "all",
      service: "all",
      minRating: 0,
      available: false,
      sortBy: "rating",
    });
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Rechercher un technicien, service..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Rechercher</Button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={service} onValueChange={setService}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            {SERVICES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ville" />
          </SelectTrigger>
          <SelectContent>
            {CITIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtres avancés
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtres avancés</SheetTitle>
              <SheetDescription>
                Affinez votre recherche pour trouver le technicien idéal
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Rating Filter */}
              <div className="space-y-2">
                <Label>Note minimale</Label>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <Button
                      key={rating}
                      variant={minRating === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMinRating(rating)}
                      className="flex-1"
                    >
                      {rating === 0 ? (
                        "Toutes"
                      ) : (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {rating}+
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div className="flex items-center justify-between">
                <Label htmlFor="available">Disponible immédiatement</Label>
                <Switch
                  id="available"
                  checked={availableOnly}
                  onCheckedChange={setAvailableOnly}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Réinitialiser
                </Button>
                <Button onClick={handleSearch} className="flex-1">
                  Appliquer
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}


