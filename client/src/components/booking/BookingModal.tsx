import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Calendar, Clock, Star, Shield, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TechnicianMatch } from "@shared/schema";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: TechnicianMatch | null;
  jobId: string;
}

export function BookingModal({ isOpen, onClose, match, jobId }: BookingModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    scheduledDate: "",
    scheduledTime: "",
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const bookingMutation = useMutation({
    mutationFn: async (data: typeof formData & { jobId: string; technicianId: string }) => {
      return apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: () => {
      setBookingSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: t("booking.success"),
        description: "Vous recevrez une confirmation par SMS.",
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: "Impossible de créer la réservation.",
        variant: "destructive",
      });
    },
  });

  if (!match) return null;

  const { technician } = match;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientPhone || !formData.scheduledDate || !formData.scheduledTime) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }
    bookingMutation.mutate({
      ...formData,
      jobId,
      technicianId: technician.id,
    });
  };

  const handleClose = () => {
    setBookingSuccess(false);
    setFormData({ clientName: "", clientPhone: "", scheduledDate: "", scheduledTime: "" });
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

  if (bookingSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("booking.success")}</h2>
            <p className="text-muted-foreground mb-6">
              {technician.name} a été notifié et vous contactera bientôt.
            </p>
            <Button onClick={handleClose} data-testid="button-close-success">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 border font-bold">
              {Math.round(match.matchScore * 100)}%
            </Badge>
            <div className="text-sm font-semibold text-chart-2 mt-1">
              ~{match.estimatedCost.likelyCost} {t("common.mad")}
            </div>
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
