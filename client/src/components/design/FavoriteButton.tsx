import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FavoriteButtonProps {
  technicianId: string;
  initialIsFavorite?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FavoriteButton({ technicianId, initialIsFavorite = false, size = "md", className = "" }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const toggleFavorite = async () => {
    setIsLoading(true);
    try {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/technician/${technicianId}`);
        setIsFavorite(false);
        toast({ title: "Supprimé des favoris", description: "Artisan retiré de vos favoris." });
      } else {
        await apiRequest("POST", "/api/favorites", { technicianId });
        setIsFavorite(true);
        toast({ title: "Ajouté aux favoris", description: "Artisan ajouté à vos favoris !" });
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: "Veuillez vous connecter pour ajouter aux favoris.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`rounded-full ${sizeClasses[size]} ${isFavorite ? "bg-red-50 border-red-200" : "bg-white/80 backdrop-blur-sm"} ${className}`}
    >
      <Heart className={`${iconSizes[size]} transition-all duration-200 ${isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-slate-400"}`} />
    </Button>
  );
}
