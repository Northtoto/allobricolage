import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Star, 
  MapPin, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Briefcase, 
  CheckCircle,
  Quote
} from "lucide-react";
import type { TechnicianWithUser } from "@shared/schema";
import { useState } from "react";
import { BookingModal } from "@/components/booking/BookingModal";

export default function TechnicianProfile() {
  const { id } = useParams<{ id: string }>();
  const [showBooking, setShowBooking] = useState(false);

  const { data: technician, isLoading, error } = useQuery<TechnicianWithUser>({
    queryKey: ['/api/technicians', id],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="p-6">
              <Skeleton className="w-32 h-32 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          </div>
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-1/4 mb-4" />
              <Skeleton className="h-20 w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !technician) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Technicien non trouvé</p>
          <Link href="/">
            <Button variant="outline">Retour à l'accueil</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(technician.name)}&size=256&background=1e40af&color=fff`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span data-testid="link-back">Retour aux techniciens</span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="p-6 sticky top-4">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                    <AvatarImage 
                      src={technician.photo || defaultImage} 
                      alt={technician.name}
                      data-testid="img-profile-avatar"
                    />
                    <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                      {technician.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  {technician.isPro && (
                    <Badge 
                      className="absolute -bottom-1 -right-1 bg-green-500 text-white border-2 border-background"
                      data-testid="badge-profile-pro"
                    >
                      PRO
                    </Badge>
                  )}
                </div>

                <h1 
                  className="text-xl font-bold text-foreground mb-1"
                  data-testid="text-profile-name"
                >
                  {technician.name}
                </h1>

                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                  <MapPin className="h-4 w-4" />
                  <span data-testid="text-profile-location">{technician.city}</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span 
                      className="font-bold text-foreground text-lg"
                      data-testid="text-profile-rating"
                    >
                      {technician.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    ({technician.reviewCount} avis)
                  </span>
                </div>

                <div className="w-full mb-4">
                  <p className="text-2xl font-bold text-primary" data-testid="text-profile-price">
                    {technician.hourlyRate} MAD / heure
                  </p>
                </div>

                <Button 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-lg py-6"
                  onClick={() => setShowBooking(true)}
                  data-testid="button-book-profile"
                >
                  Réserver
                </Button>

                <Badge 
                  variant="outline"
                  className={`mt-4 ${
                    technician.availability === "Immédiat" 
                      ? "border-green-500 text-green-600" 
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                  data-testid="badge-profile-availability"
                >
                  {technician.availability}
                </Badge>
              </div>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            {technician.bio && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Quote className="h-5 w-5 text-primary" />
                  À propos
                </h2>
                <p 
                  className="text-muted-foreground leading-relaxed"
                  data-testid="text-profile-bio"
                >
                  {technician.bio}
                </p>
              </Card>
            )}

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Informations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {technician.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Téléphone</p>
                      <p 
                        className="font-medium text-foreground text-sm"
                        data-testid="text-profile-phone"
                      >
                        {technician.phone}
                      </p>
                    </div>
                  </div>
                )}
                {technician.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p 
                        className="font-medium text-foreground text-sm truncate"
                        data-testid="text-profile-email"
                      >
                        {technician.email}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Expérience</p>
                    <p 
                      className="font-medium text-foreground text-sm"
                      data-testid="text-profile-experience"
                    >
                      {technician.yearsExperience} ans
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Spécialités
              </h2>
              <div className="flex flex-wrap gap-2" data-testid="container-specialties">
                {technician.skills.map((skill, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="bg-primary/10 text-primary border-0 px-3 py-1"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>

            {technician.certifications && technician.certifications.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Certifications
                </h2>
                <ul className="space-y-2" data-testid="container-certifications">
                  {technician.certifications.map((cert, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{cert}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {technician.recentReview && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Derniers Avis
                </h2>
                <div 
                  className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary"
                  data-testid="container-review"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < (technician.recentReview?.rating || 5) 
                              ? "fill-current" 
                              : "text-muted"
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground italic mb-2">
                    "{technician.recentReview.text}"
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    — {technician.recentReview.author}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showBooking && (
        <BookingModal
          technician={technician}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}
