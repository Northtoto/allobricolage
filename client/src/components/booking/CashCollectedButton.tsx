import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Banknote, Loader2, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * P1-6 cash-first — "Cash collecté". After an out-of-band cash or CashPlus
 * payment, the assigned technician confirms collection, settling the payment.
 * The button only appears for an unsettled cash/cashplus payment; for any other
 * method (or once settled) it renders nothing, so it never clutters the UI.
 */
interface CashCollectedButtonProps {
  bookingId: string;
}

interface EscrowInfo {
  paymentId: string;
  status: string;
  paymentMethod: string;
  bankReference: string | null;
}

const CASH_METHODS = ["cash", "cashplus"];

export function CashCollectedButton({ bookingId }: CashCollectedButtonProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { data: escrow, refetch } = useQuery<EscrowInfo | null>({
    queryKey: ["/api/payments/escrow", bookingId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/payments/escrow/${bookingId}`);
      if (!res.ok) return null;
      const body = await res.json();
      return body.data ?? null;
    },
  });

  // Nothing to collect: no payment, not a cash method, or already settled.
  if (!escrow || !CASH_METHODS.includes(escrow.paymentMethod)) return null;
  if (escrow.status === "completed" || confirmed) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-emerald-600" data-testid="cash-collected-done">
        <CheckCircle2 className="h-4 w-4" />
        Paiement encaissé
      </span>
    );
  }

  async function handleConfirm() {
    if (submitting || !escrow) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/payments/${escrow.paymentId}/confirm-cash`);
      if (!res.ok) {
        toast({
          title: "Échec de la confirmation",
          description: "Impossible d'enregistrer l'encaissement. Réessayez.",
          variant: "destructive",
        });
        return;
      }
      setConfirmed(true);
      toast({ title: "Encaissement confirmé", description: "Le paiement a été marqué comme reçu." });
      refetch();
    } catch {
      toast({ title: "Erreur réseau", description: "Vérifiez votre connexion.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const isCashPlus = escrow.paymentMethod === "cashplus";

  return (
    <Button
      size="sm"
      className="gap-2"
      onClick={handleConfirm}
      disabled={submitting}
      data-testid="button-cash-collected"
    >
      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
      {isCashPlus && escrow.bankReference
        ? `Confirmer CashPlus (${escrow.bankReference})`
        : "Cash collecté"}
    </Button>
  );
}
