import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Loader2 } from "lucide-react";

interface SubmitQuoteDialogProps {
  bookingId: string;
}

// Technician-side devis form. Posts to /api/quotes; the client then
// accepts/rejects it (QuoteReviewCard), which locks booking.estimatedCost.
export function SubmitQuoteDialog({ bookingId }: SubmitQuoteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [materialsCost, setMaterialsCost] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/quotes", {
        bookingId,
        description,
        laborCost: Math.round(Number(laborCost) || 0),
        materialsCost: Math.round(Number(materialsCost) || 0),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes/booking", bookingId] });
      toast({
        title: "Devis envoyé",
        description: "Le client a été notifié et peut désormais le valider.",
      });
      setOpen(false);
      setDescription("");
      setLaborCost("");
      setMaterialsCost("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le devis.",
        variant: "destructive",
      });
    },
  });

  const total = (Number(laborCost) || 0) + (Number(materialsCost) || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid={`button-submit-quote-${bookingId}`}>
          <FileText className="h-4 w-4 mr-2" />
          Envoyer un devis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Devis pour cette intervention</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`quote-desc-${bookingId}`}>Description des travaux</Label>
            <Textarea
              id={`quote-desc-${bookingId}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détaillez les travaux à réaliser..."
              rows={3}
              data-testid="textarea-quote-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`quote-labor-${bookingId}`}>Main d'œuvre (MAD)</Label>
              <Input
                id={`quote-labor-${bookingId}`}
                type="number"
                min="0"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                data-testid="input-quote-labor-cost"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`quote-materials-${bookingId}`}>Matériel (MAD)</Label>
              <Input
                id={`quote-materials-${bookingId}`}
                type="number"
                min="0"
                value={materialsCost}
                onChange={(e) => setMaterialsCost(e.target.value)}
                data-testid="input-quote-materials-cost"
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{total} MAD</span>
          </div>
          <Button
            className="w-full"
            disabled={!description.trim() || total <= 0 || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
            data-testid="button-confirm-quote"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              "Envoyer le devis"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
