import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getErrorMessage } from "@/lib/api-client";
import { 
  CreditCard,
  Building2,
  Wallet,
  CheckCircle2,
  Shield,
  ArrowLeft,
  Copy,
  Check,
  FileText,
  Download,
  Banknote
} from "lucide-react";

type PaymentMethod = "cash" | "cmi" | "cashplus" | "bank_transfer";

interface BookingData {
  id: string;
  estimatedCost?: number;
  clientPhone?: string;
  clientName?: string;
  status?: string;
  service?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

interface BankDetails {
  reference?: string;
  companyName?: string;
  bankName?: string;
  rib?: string;
  iban?: string;
  amount?: number;
}

interface PaymentData {
  status?: string;
  amount?: number;
}

export default function PaymentPage() {
  const [, params] = useRoute("/payment/:bookingId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const bookingId = params?.bookingId;

  // Cash after service is the Moroccan default (~84% of payments are cash); online
  // methods are optional alternatives.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(false);
  const [cashPlusReference, setCashPlusReference] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch booking details
  const { data: booking, isLoading: bookingLoading } = useQuery<BookingData>({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId,
  });

  // Fetch payment status
  const { data: payment } = useQuery<PaymentData>({
    queryKey: [`/api/payments/booking/${bookingId}`],
    enabled: !!bookingId,
    retry: false,
  });

  // Fetch bank transfer details
  const { data: bankDetails } = useQuery<BankDetails>({
    queryKey: [`/api/payments/bank-transfer/details?bookingId=${bookingId}`],
    enabled: paymentMethod === "bank_transfer" && !!bookingId,
  });

  useEffect(() => {
    if (bankDetails?.reference) {
      setBankReference(bankDetails.reference);
    }
  }, [bankDetails]);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copié!",
      description: "Le texte a été copié dans le presse-papiers",
    });
  };

  const handlePayment = async () => {
    if (!bookingId) return;
    const amount = booking?.estimatedCost ?? 0;
    if (amount <= 0) {
      toast({
        title: "Montant indisponible",
        description: "Le montant de la réservation n'est pas encore défini.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // All methods record the payment via the real authenticated endpoint.
      // (Dedicated CMI/CashPlus gateway redirects require a backend integration
      // with merchant credentials — see README; not yet wired.)
      const response = await apiRequest("POST", "/api/payments/create", {
        bookingId,
        amount,
        paymentMethod,
        currency: "MAD",
      });
      const result = await response.json(); // { paymentId, transactionId, status }

      if (paymentMethod === "cash") {
        toast({
          title: "Paiement en espèces confirmé",
          description: "Réglez le technicien en espèces une fois le travail terminé. Rien à payer maintenant.",
        });
      } else if (paymentMethod === "bank_transfer") {
        toast({
          title: "Instructions de virement",
          description: "Effectuez le virement avec la référence fournie ci-dessous.",
        });
      } else if (paymentMethod === "cashplus") {
        setCashPlusReference(result.transactionId ?? "");
        toast({
          title: "Demande Cash Plus enregistrée",
          description: "Présentez la référence dans n'importe quel point Cash Plus.",
        });
      } else {
        toast({
          title: "Demande de paiement enregistrée",
          description: "Votre paiement est en cours de traitement.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    window.open(`/api/invoices/${bookingId}`, '_blank');
  };

  if (bookingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Réservation introuvable</h1>
            <Button onClick={() => setLocation("/")} className="mt-4">
              Retour à l'accueil
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isPaid = payment?.status === "completed";
  const isCompleted = booking.status === "completed";
  const amount = booking.estimatedCost || 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    {isPaid ? "Paiement Confirmé" : "Paiement sécurisé"}
                  </CardTitle>
                  <CardDescription>
                    {isPaid ? "Votre réservation est validée." : "Choisissez votre mode de paiement préféré"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isPaid ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="flex justify-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-green-700">Paiement reçu avec succès!</h3>
                      <p className="text-gray-600">
                        Merci pour votre paiement. Votre facture est disponible ci-dessous.
                      </p>
                      <Button onClick={handleDownloadInvoice} className="gap-2">
                        <Download className="h-4 w-4" />
                        Télécharger la facture
                      </Button>
                    </div>
                  ) : isCompleted ? (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                          ✅ Le service a été terminé. Vous pouvez maintenant procéder au paiement.
                        </p>
                      </div>
                      <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                      {/* Cash after service — the Moroccan default, shown first */}
                      <div
                        className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === "cash"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setPaymentMethod("cash")}
                      >
                        <RadioGroupItem value="cash" id="cash" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-green-600" />
                            <Label htmlFor="cash" className="text-base font-semibold cursor-pointer">
                              Espèces après le service
                            </Label>
                            <Badge className="ml-auto bg-green-600 text-white">Recommandé</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Payez le technicien en espèces une fois le travail terminé et validé. Aucun paiement à l'avance.
                          </p>
                        </div>
                      </div>

                      {/* CMI Payment (online, optional) */}
                      <div
                        className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === "cmi"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setPaymentMethod("cmi")}
                      >
                        <RadioGroupItem value="cmi" id="cmi" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-gray-600" />
                            <Label htmlFor="cmi" className="text-base font-semibold cursor-pointer">
                              Carte bancaire marocaine (CMI)
                            </Label>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Paiement en ligne sécurisé avec votre carte bancaire marocaine
                          </p>
                          <div className="flex gap-2 mt-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                          </div>
                        </div>
                      </div>

                      {/* Cash Plus */}
                      <div
                        className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === "cashplus"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setPaymentMethod("cashplus")}
                      >
                        <RadioGroupItem value="cashplus" id="cashplus" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-gray-600" />
                            <Label htmlFor="cashplus" className="text-base font-semibold cursor-pointer">
                              Cash Plus
                            </Label>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Payez en espèces dans n'importe quel point Cash Plus
                          </p>
                          {cashPlusReference && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-sm font-semibold text-yellow-900">Référence Cash Plus:</p>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="text-lg font-bold text-yellow-900">{cashPlusReference}</code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyToClipboard(cashPlusReference)}
                                >
                                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                              <p className="text-xs text-yellow-700 mt-2">
                                Présentez cette référence dans n'importe quel point Cash Plus avec le montant
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bank Transfer */}
                      <div
                        className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === "bank_transfer"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setPaymentMethod("bank_transfer")}
                      >
                        <RadioGroupItem value="bank_transfer" id="bank_transfer" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-gray-600" />
                            <Label htmlFor="bank_transfer" className="text-base font-semibold cursor-pointer">
                              Virement bancaire (RIB/IBAN)
                            </Label>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Effectuez un virement depuis votre banque
                          </p>
                          {paymentMethod === "bank_transfer" && bankDetails && (
                            <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded space-y-2">
                              <div>
                                <p className="text-xs text-gray-500">Bénéficiaire</p>
                                <p className="font-semibold">{bankDetails.companyName}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Banque</p>
                                <p className="font-semibold">{bankDetails.bankName}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">RIB</p>
                                <div className="flex items-center gap-2">
                                  <code className="font-mono text-sm">{bankDetails.rib}</code>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCopyToClipboard(bankDetails.rib || "")}
                                  >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">IBAN</p>
                                <div className="flex items-center gap-2">
                                  <code className="font-mono text-sm">{bankDetails.iban}</code>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCopyToClipboard(bankDetails.iban || "")}
                                  >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <p className="text-xs text-gray-500">Référence à mentionner</p>
                                <div className="flex items-center gap-2">
                                  <code className="font-mono text-sm font-bold text-blue-600">{bankReference}</code>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCopyToClipboard(bankReference)}
                                  >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                                <p className="text-xs text-red-600 mt-1">
                                  ⚠️ Important: Mentionnez cette référence dans le motif du virement
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </RadioGroup>
                  </>
                  ) : (
                    <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800">
                        ⏳ En attente de la fin du service. Le paiement sera disponible une fois le technicien aura terminé la mission.
                      </p>
                    </div>
                  )}

                  {!isPaid && isCompleted && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-3 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                        <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-900">Paiement 100% sécurisé</p>
                          <p className="text-xs text-green-700">
                            Vos données sont cryptées et protégées selon les normes bancaires internationales
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full h-12 text-lg"
                        size="lg"
                      >
                        {loading ? (
                          "Traitement en cours..."
                        ) : paymentMethod === "cash" ? (
                          "Confirmer (payer en espèces après le service)"
                        ) : paymentMethod === "cmi" ? (
                          "Procéder au paiement"
                        ) : paymentMethod === "cashplus" ? (
                          cashPlusReference ? "Référence générée" : "Générer la référence"
                        ) : (
                          "Confirmer les instructions"
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="font-semibold capitalize">{booking.service || "Service"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">{booking.scheduledDate}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Heure</p>
                    <p className="font-semibold">{booking.scheduledTime}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm text-gray-600">Montant du service</p>
                    <p className="text-lg font-semibold">{amount} MAD</p>
                  </div>

                  <div className="pt-4 border-t-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total à payer</span>
                      <span className="text-2xl font-bold text-blue-600">{amount} MAD</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Paiement sécurisé garanti</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

