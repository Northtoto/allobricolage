import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ShieldAlert, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * P0-3 — "Signaler un problème sous garantie". Lets a client open a warranty
 * claim on a completed booking; the server enforces the guarantee window and
 * flags it so a free re-visit can be fast-tracked. The button is intentionally
 * shown on every completed booking — eligibility is the server's call, and a
 * clear 422 message is friendlier than hiding the action.
 */
interface WarrantyClaimButtonProps {
  bookingId: string;
  /** Called after a successful claim so the parent can refetch. */
  onClaimed?: () => void;
}

// Mirror the server's validation: description must be 20–2000 chars.
const MIN_DESCRIPTION = 20;
const MAX_DESCRIPTION = 2000;

export function WarrantyClaimButton({ bookingId, onClaimed }: WarrantyClaimButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tooShort = description.trim().length < MIN_DESCRIPTION;

  async function handleSubmit() {
    if (tooShort || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/disputes/warranty-claim", {
        bookingId,
        description: description.trim(),
      });

      if (!res.ok) {
        // 422 = outside the guarantee window; 409 = a dispute already exists.
        const message =
          res.status === 422
            ? "Ce service n'est plus couvert par la garantie."
            : res.status === 409
              ? "Une réclamation existe déjà pour cette réservation."
              : "Impossible d'envoyer la réclamation. Réessayez.";
        toast({ title: "Réclamation non envoyée", description: message, variant: "destructive" });
        return;
      }

      toast({
        title: "Réclamation envoyée",
        description: "Nous traitons votre demande sous garantie. Vous serez recontacté rapidement.",
      });
      setOpen(false);
      setDescription("");
      onClaimed?.();
    } catch {
      toast({
        title: "Erreur réseau",
        description: "Vérifiez votre connexion et réessayez.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-warranty-claim">
          <ShieldAlert className="h-4 w-4" />
          Signaler un problème sous garantie
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réclamation sous garantie</DialogTitle>
          <DialogDescription>
            Décrivez le problème rencontré après l'intervention. Si le service est encore
            couvert, nous pouvons organiser une nouvelle visite gratuite.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={MAX_DESCRIPTION}
          rows={5}
          placeholder="Ex : la fuite est réapparue deux jours après la réparation…"
          data-testid="input-warranty-description"
        />
        <p className="text-xs text-muted-foreground">
          {tooShort
            ? `Encore ${MIN_DESCRIPTION - description.trim().length} caractère(s) minimum.`
            : `${description.trim().length}/${MAX_DESCRIPTION}`}
        </p>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={tooShort || submitting}
            data-testid="button-warranty-submit"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Envoyer la réclamation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
