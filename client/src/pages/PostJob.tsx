import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIAnalysisPanel } from "@/components/job/AIAnalysisPanel";
import { CostEstimateCard } from "@/components/job/CostEstimateCard";
import { TechnicianCard } from "@/components/technician/TechnicianCard";
import { BookingModal } from "@/components/booking/BookingModal";
import { UpsellSuggestions } from "@/components/booking/UpsellSuggestions";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Send, 
  Loader2, 
  MapPin, 
  AlertTriangle,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import type { JobAnalysis, CostEstimate, TechnicianMatch, UpsellSuggestion, Job } from "@shared/schema";

const MOROCCAN_CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Fès",
  "Tanger",
  "Agadir",
  "Meknès",
  "Oujda",
  "Kenitra",
  "Tétouan",
];

export default function PostJob() {
  const { t } = useI18n();
  const { toast } = useToast();
  const searchParams = useSearch();
  const [, setLocation] = useLocation();
  
  const urlParams = new URLSearchParams(searchParams);
  const initialQuery = urlParams.get("q") || "";
  const initialService = urlParams.get("service") || "";
  
  const [description, setDescription] = useState(initialQuery);
  const [city, setCity] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [matches, setMatches] = useState<TechnicianMatch[]>([]);
  const [upsellSuggestions, setUpsellSuggestions] = useState<UpsellSuggestion[]>([]);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<TechnicianMatch | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [step, setStep] = useState<"input" | "analysis" | "matches">("input");

  // AI Analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async (data: { description: string; city: string; urgency: string }) => {
      const response = await apiRequest("POST", "/api/jobs/analyze", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setCostEstimate(data.costEstimate);
      setStep("analysis");
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: "Impossible d'analyser votre demande.",
        variant: "destructive",
      });
    },
  });

  // Find matches mutation
  const matchMutation = useMutation({
    mutationFn: async (data: { description: string; city: string; urgency: string; analysis: JobAnalysis }) => {
      const response = await apiRequest("POST", "/api/jobs", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentJob(data.job);
      setMatches(data.matches);
      setUpsellSuggestions(data.upsellSuggestions || []);
      setStep("matches");
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: "Impossible de trouver des artisans.",
        variant: "destructive",
      });
    },
  });

  // Debounced analysis
  const debouncedAnalyze = useCallback(() => {
    if (description.length > 20 && city) {
      analyzeMutation.mutate({ description, city, urgency });
    }
  }, [description, city, urgency]);

  useEffect(() => {
    const timer = setTimeout(debouncedAnalyze, 1000);
    return () => clearTimeout(timer);
  }, [description, city]);

  // Pre-fill service from URL
  useEffect(() => {
    if (initialService) {
      const serviceDescriptions: Record<string, string> = {
        plomberie: "J'ai besoin d'un plombier pour ",
        electricite: "J'ai besoin d'un électricien pour ",
        peinture: "J'ai besoin d'un peintre pour ",
        menuiserie: "J'ai besoin d'un menuisier pour ",
        climatisation: "J'ai besoin d'un technicien climatisation pour ",
        maconnerie: "J'ai besoin d'un maçon pour ",
        carrelage: "J'ai besoin d'un carreleur pour ",
        serrurerie: "J'ai besoin d'un serrurier pour ",
        jardinage: "J'ai besoin d'un jardinier pour ",
        nettoyage: "J'ai besoin d'un service de nettoyage pour ",
      };
      if (serviceDescriptions[initialService]) {
        setDescription(serviceDescriptions[initialService]);
      }
    }
  }, [initialService]);

  const handleSubmit = () => {
    if (!description || !city) {
      toast({
        title: "Champs requis",
        description: "Veuillez décrire votre problème et sélectionner une ville.",
        variant: "destructive",
      });
      return;
    }

    if (step === "input") {
      analyzeMutation.mutate({ description, city, urgency });
    } else if (step === "analysis" && analysis) {
      matchMutation.mutate({ description, city, urgency, analysis });
    }
  };

  const handleBook = (match: TechnicianMatch) => {
    setSelectedMatch(match);
    setIsBookingOpen(true);
  };

  const handleAddUpsell = (suggestion: UpsellSuggestion) => {
    toast({
      title: "Service ajouté",
      description: `${suggestion.service} a été ajouté à votre demande.`,
    });
  };

  const handleBack = () => {
    if (step === "matches") {
      setStep("analysis");
    } else if (step === "analysis") {
      setStep("input");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {["input", "analysis", "matches"].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === s 
                      ? "bg-primary text-primary-foreground" 
                      : ["input", "analysis", "matches"].indexOf(step) > idx
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < 2 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    ["input", "analysis", "matches"].indexOf(step) > idx
                      ? "bg-green-500"
                      : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Back Button */}
          {step !== "input" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-4"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          )}

          {/* Step: Input */}
          {step === "input" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <h1 className="text-2xl font-bold mb-6">{t("job.title")}</h1>
                  
                  <div className="space-y-6">
                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-base font-medium">
                        {t("job.description")}
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t("job.descPlaceholder")}
                        className="min-h-[150px] text-base resize-none"
                        data-testid="input-job-description"
                      />
                      <p className="text-xs text-muted-foreground">
                        Tip: Soyez précis pour obtenir de meilleures correspondances IA
                      </p>
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {t("job.city")}
                      </Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger data-testid="select-city">
                          <SelectValue placeholder={t("job.selectCity")} />
                        </SelectTrigger>
                        <SelectContent>
                          {MOROCCAN_CITIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Urgency */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {t("job.urgency")}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "low", label: t("job.urgencyLow"), color: "bg-green-500/10 text-green-600 border-green-500/20" },
                          { value: "normal", label: t("job.urgencyNormal"), color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
                          { value: "high", label: t("job.urgencyHigh"), color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
                          { value: "emergency", label: t("job.urgencyEmergency"), color: "bg-red-500/10 text-red-600 border-red-500/20" },
                        ].map((u) => (
                          <Badge
                            key={u.value}
                            className={`cursor-pointer border transition-all ${
                              urgency === u.value 
                                ? u.color + " ring-2 ring-offset-2 ring-primary" 
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                            onClick={() => setUrgency(u.value)}
                            data-testid={`badge-urgency-${u.value}`}
                          >
                            {u.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Submit */}
                    <Button
                      onClick={handleSubmit}
                      disabled={!description || !city || analyzeMutation.isPending}
                      className="w-full h-12 text-base"
                      data-testid="button-analyze-job"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Analyse en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Analyser avec l'IA
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* AI Analysis Sidebar */}
              <div className="space-y-4">
                <AIAnalysisPanel 
                  analysis={analysis} 
                  isLoading={analyzeMutation.isPending} 
                />
              </div>
            </div>
          )}

          {/* Step: Analysis Review */}
          {step === "analysis" && analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Résumé de votre demande</h2>
                  
                  <div className="p-4 rounded-lg bg-muted/50 border border-border mb-6">
                    <p className="text-lg">{description}</p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {city}
                    </div>
                  </div>

                  <AIAnalysisPanel analysis={analysis} isLoading={false} />

                  <Button
                    onClick={handleSubmit}
                    disabled={matchMutation.isPending}
                    className="w-full h-12 text-base mt-6"
                    data-testid="button-find-matches"
                  >
                    {matchMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Recherche d'artisans...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        {t("job.findMatches")}
                      </>
                    )}
                  </Button>
                </Card>
              </div>

              <div className="space-y-4">
                <CostEstimateCard estimate={costEstimate} isLoading={false} />
              </div>
            </div>
          )}

          {/* Step: Matches */}
          {step === "matches" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{t("match.title")}</h2>
                  <Badge variant="secondary" className="text-sm">
                    {matches.length} artisans trouvés
                  </Badge>
                </div>

                <div className="space-y-6">
                  {matches.map((match, index) => (
                    <TechnicianCard
                      key={match.technician.id}
                      match={match}
                      rank={index + 1}
                      onBook={handleBook}
                    />
                  ))}

                  {matches.length === 0 && (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">
                        Aucun artisan disponible pour le moment. Essayez d'élargir votre recherche.
                      </p>
                    </Card>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <CostEstimateCard estimate={costEstimate} />
                <UpsellSuggestions 
                  suggestions={upsellSuggestions} 
                  onAdd={handleAddUpsell} 
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        match={selectedMatch}
        jobId={currentJob?.id || ""}
      />
    </div>
  );
}
