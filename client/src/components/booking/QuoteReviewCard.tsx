import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface Quote {
  id: string;
  bookingId: string;
  description: string;
  amount: number;
  laborCost: number;
  materialsCost: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  priceFlag: "normal" | "above_market" | "below_market";
  expectedMin: number;
  expectedMax: number;
}

interface QuoteReviewCardProps {
  bookingId: string;
}

// Client-side devis review — shows any pending quote for this booking and
// lets the client accept (locks booking.estimatedCost server-side) or reject it.
export function QuoteReviewCard({ bookingId }: QuoteReviewCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotes } = useQuery<Quote[]>({
    queryKey: ["/api/quotes/booking", bookingId],
  });

  const respondMutation = useMutation({
    mutationFn: async ({ quoteId, action }: { quoteId: string; action: "accept" | "reject" }) => {
      const response = await apiRequest("POST", `/api/quotes/${quoteId}/${action}`);
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes/booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: variables.action === "accept" ? "Devis accepté" : "Devis refusé",
        description: variables.action === "accept"
          ? "Le prix est confirmé. Vous réglerez ce montant après le service."
          : "Le technicien a été notifié.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Action impossible pour le moment.",
        variant: "destructive",
      });
    },
  });

  const pending = quotes?.filter((q) => q.status === "pending") ?? [];
  if (pending.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {pending.map((quote) => (
        <div
          key={quote.id}
          className="rounded-lg border border-primary/30 bg-primary/5 p-4"
          data-testid={`quote-card-${quote.id}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Devis reçu</span>
            {quote.priceFlag === "above_market" && (
              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 border text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" /> Au-dessus du marché
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{quote.description}</p>
          <p className="text-lg font-bold text-chart-2 mb-3">{quote.amount} MAD</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => respondMutation.mutate({ quoteId: quote.id, action: "reject" })}
              disabled={respondMutation.isPending}
              data-testid={`button-reject-quote-${quote.id}`}
            >
              <XCircle className="h-4 w-4 mr-1" /> Refuser
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => respondMutation.mutate({ quoteId: quote.id, action: "accept" })}
              disabled={respondMutation.isPending}
              data-testid={`button-accept-quote-${quote.id}`}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Accepter
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
