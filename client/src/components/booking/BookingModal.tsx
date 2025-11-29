import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Calendar, Clock, Star, Shield, Loader2, CheckCircle, Wand2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TechnicianMatch, TechnicianWithUser } from "@shared/schema";

interface BookingModalProps {
  isOpen?: boolean;
  onClose: () => void;
  match?: TechnicianMatch | null;
  technician?: TechnicianWithUser | null;
  jobId?: string;
}

export function BookingModal({ isOpen = true, onClose, match, technician: standaloneTechnician, jobId = "direct" }: BookingModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    scheduledDate: "",
    scheduledTime: "",
    description: "",
  });
  const [isEnhancing, setIsEnhancing] = useState(false);

  const technician = match?.technician || standaloneTechnician;

  // Check if user is authenticated
  const { data: user, isLoading: isCheckingAuth } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: typeof formData & { jobId: string; technicianId: string }) => {
      const response = await apiRequest("POST", "/api/bookings", data);
      return response.json(); // Parse JSON from Response object
    },
    onSuccess: (data: any) => {
      console.log("✅ Booking created successfully");
      console.log("📦 Response data:", data);
      console.log("🆔 Booking ID:", data?.id);
      
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      
      // Show success toast
      toast({
        title: "Réservation créée!",
        description: "Le technicien a été notifié. Suivez le statut dans votre tableau de bord.",
      });
      
      // Redirect to client dashboard
      if (data?.id) {
        console.log("🔀 Redirecting to:", `/client-dashboard`);
        // Close modal first
        onClose();
        // Then redirect
        setTimeout(() => {
          setLocation(`/client-dashboard`);
        }, 500);
      } else {
        console.error("❌ No booking ID returned:", data);
        toast({
          title: "Erreur",
          description: "ID de réservation manquant",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("❌ Booking error:", error);
      toast({
        title: t("common.error"),
        description: "Impossible de créer la réservation.",
        variant: "destructive",
      });
    },
  });

  if (!technician) return null;

  const handleEnhanceWithAI = async () => {
    if (!formData.description.trim()) {
      toast({
        title: "Description requise",
        description: "Veuillez d'abord décrire votre problème.",
        variant: "destructive",
      });
      return;
    }
    setIsEnhancing(true);
    try {
      const response = await apiRequest("POST", "/api/jobs/analyze", { 
        description: formData.description,
        city: technician?.city || "Casablanca",
        urgency: "normal"
      });
      const result = await response.json();
      const analysis = result.analysis || result;
      if (analysis.extractedKeywords && analysis.extractedKeywords.length > 0) {
        const enhanced = `${formData.description}\n\nDétails identifiés: ${analysis.extractedKeywords.join(", ")}. Urgence: ${analysis.urgency || "normale"}. Complexité: ${analysis.complexity || "modérée"}.`;
        setFormData({ ...formData, description: enhanced });
        toast({
          title: "Description améliorée",
          description: "L'IA a enrichi votre description.",
        });
      } else {
        toast({
          title: "Analyse complète",
          description: "Votre description est déjà bien détaillée.",
        });
      }
    } catch {
      toast({
        title: "Amélioration échouée",
        description: "Impossible d'améliorer la description pour le moment.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated before booking
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour réserver. Cliquez sur Se connecter dans le menu.",
        variant: "destructive",
      });
      onClose();
      setTimeout(() => setLocation("/login"), 500);
      return;
    }

    if (!formData.clientName || !formData.clientPhone || !formData.scheduledDate || !formData.scheduledTime) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }
    bookingMutation.mutate({
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      description: formData.description,
      jobId,
      technicianId: technician.id,
    });
  };

  const handleClose = () => {
    setFormData({ clientName: "", clientPhone: "", scheduledDate: "", scheduledTime: "", description: "" });
    onClose();
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 8; h <= 20; h++) {
      slots.push(`${h.toString().padStart(2, "0")}:00`);
      if (h < 20) slots.push(`${h.toString().padStart(2, "0")}:30`);
    }
    return slots;
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("booking.title")}</DialogTitle>
        </DialogHeader>

        {/* Technician Summary */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border mb-4">
          <Avatar className="h-14 w-14 border-2 border-border">
            <AvatarImage src={technician.photo || undefined} alt={technician.name} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {technician.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{technician.name}</h3>
              {technician.isVerified && <Shield className="h-4 w-4 text-blue-500" />}
            </div>
            <div className="flex items-center gap-1 text-sm text-yellow-500">
              <Star className="h-3 w-3 fill-current" />
              <span>{technician.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({technician.reviewCount} avis)</span>
            </div>
          </div>
          <div className="text-right">
            {match ? (
              <>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 border font-bold">
                  {Math.round(match.matchScore * 100)}%
                </Badge>
                <div className="text-sm font-semibold text-chart-2 mt-1">
                  ~{match.estimatedCost.likelyCost} {t("common.mad")}
                </div>
              </>
            ) : (
              <div className="text-sm font-semibold text-chart-2">
                {technician.hourlyRate} {t("common.mad")}/h
              </div>
            )}
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">{t("booking.name")}</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Votre nom complet"
                data-testid="input-client-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">{t("booking.phone")}</Label>
              <Input
                id="clientPhone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                placeholder="+212 6XX-XXXXXX"
                data-testid="input-client-phone"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("booking.date")}
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                data-testid="input-scheduled-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("booking.time")}
              </Label>
              <select
                id="scheduledTime"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                data-testid="select-scheduled-time"
              >
                <option value="">Choisir...</option>
                {generateTimeSlots().map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center justify-between">
              <span>Description détaillée</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEnhanceWithAI}
                disabled={isEnhancing}
                className="text-primary hover:text-primary/80 h-auto py-1 px-2"
                data-testid="button-enhance-ai"
              >
                {isEnhancing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-1" />
                )}
                Améliorer avec IA
              </Button>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre problème en détail..."
              rows={3}
              data-testid="textarea-description"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              data-testid="button-cancel-booking"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={bookingMutation.isPending}
              data-testid="button-confirm-booking"
            >
              {bookingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirmation...
                </>
              ) : (
                t("booking.confirm")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
