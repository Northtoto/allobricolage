/**
 * 📸 Smart Photo Diagnosis Component
 * 
 * "Upload & Get Instant Quote"
 * 
 * Client takes photo of broken equipment → AI identifies problem
 * → Instant cost estimate → Matched technicians → One-click booking
 */

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Wrench,
  DollarSign,
  Star,
  ShieldCheck,
  Zap,
  AlertCircle,
  ChevronRight,
  Image as ImageIcon,
  X
} from "lucide-react";

interface PhotoAnalysis {
  equipmentType: string;
  brand?: string;
  model?: string;
  problem: string;
  problemDetails: string;
  severity: number;
  severityDescription: string;
  serviceType: string;
  estimatedTime: number;
  estimatedCost: {
    labor: number;
    parts: number;
    total: number;
    range: { min: number; max: number };
  };
  requiredParts: string[];
  safetyConcerns: string[];
  urgency: string;
  urgencyLabel: string;
  recommendations: string[];
  confidence: number;
}

interface Technician {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  services: string[];
  city: string;
  isAvailable: boolean;
  isPro: boolean;
  photoUrl?: string;
}

interface DiagnosisResult {
  success: boolean;
  analysis: PhotoAnalysis;
  job: { id: string; status: string } | null;
  matchedTechnicians: Technician[];
  autoBookingAvailable: boolean;
  recommendedTechnician: Technician | null;
}

interface PhotoDiagnosisProps {
  city?: string;
  address?: string;
  onDiagnosisComplete?: (result: DiagnosisResult) => void;
  onBookingCreated?: (bookingId: string) => void;
}

export function PhotoDiagnosis({ 
  city = "Casablanca", 
  address = "",
  onDiagnosisComplete,
  onBookingCreated
}: PhotoDiagnosisProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [userCity, setUserCity] = useState(city);
  const [userAddress, setUserAddress] = useState(address);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Diagnosis mutation
  const diagnosisMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("city", userCity);
      formData.append("address", userAddress);
      formData.append("autoCreateJob", "true");

      const response = await fetch("/api/ai/photo/diagnose", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to analyze photo");
      }

      return response.json() as Promise<DiagnosisResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      onDiagnosisComplete?.(data);
      toast({
        title: "✅ Diagnostic terminé!",
        description: `${data.analysis.equipmentType}: ${data.analysis.problem}`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur d'analyse",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Quick booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (technicianId: string) => {
      if (!photo) throw new Error("No photo");
      
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("city", userCity);
      formData.append("address", userAddress);
      formData.append("technicianId", technicianId);

      const response = await fetch("/api/ai/photo/diagnose-and-book", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create booking");
      }

      return response.json();
    },
    onSuccess: (data) => {
      onBookingCreated?.(data.booking.id);
      toast({
        title: "🎉 Réservation créée!",
        description: `Technicien ${data.technician.name} notifié`
      });
      // Redirect to client dashboard
      setTimeout(() => setLocation("/client-dashboard"), 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur de réservation",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "❌ Format invalide",
        description: "Veuillez sélectionner une image",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "❌ Fichier trop volumineux",
        description: "La taille maximale est de 10MB",
        variant: "destructive"
      });
      return;
    }

    setPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    if (photo) {
      diagnosisMutation.mutate(photo);
    }
  };

  const handleQuickBook = (technicianId: string) => {
    bookingMutation.mutate(technicianId);
  };

  const resetForm = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return "bg-green-100 text-green-800";
    if (severity <= 3) return "bg-yellow-100 text-yellow-800";
    if (severity <= 4) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">📸 Diagnostic Instantané</CardTitle>
          <CardDescription className="text-base">
            Prenez une photo du problème et obtenez un devis en quelques secondes
          </CardDescription>
        </CardHeader>
      </Card>

      {!result ? (
        /* Upload & Analysis Section */
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Photo Upload Area */}
            <div 
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                ${photoPreview 
                  ? "border-primary bg-primary/5" 
                  : "border-gray-300 hover:border-primary hover:bg-primary/5"
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <div className="relative">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetForm();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-700">
                    Cliquez ou glissez une photo ici
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    JPG, PNG ou HEIC • Max 10MB
                  </p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Badge variant="outline">
                      <Camera className="h-3 w-3 mr-1" />
                      Appareil photo
                    </Badge>
                    <Badge variant="outline">
                      <Upload className="h-3 w-3 mr-1" />
                      Télécharger
                    </Badge>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Location Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={userCity}
                  onChange={(e) => setUserCity(e.target.value)}
                  placeholder="Casablanca"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                  placeholder="123 Rue..."
                />
              </div>
            </div>

            {/* Analyze Button */}
            <Button
              size="lg"
              className="w-full text-lg h-14"
              disabled={!photo || diagnosisMutation.isPending}
              onClick={handleAnalyze}
            >
              {diagnosisMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Analyser et obtenir un devis
                </>
              )}
            </Button>

            {/* Loading Progress */}
            {diagnosisMutation.isPending && (
              <div className="space-y-2">
                <Progress value={66} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  🔍 L'IA analyse votre photo...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Results Section */
        <div className="space-y-4">
          {/* Success Header */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Diagnostic terminé!</h3>
                  <p className="text-sm text-green-600">
                    Confiance: {Math.round(result.analysis.confidence * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Problem Analysis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Problème détecté
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xl font-semibold">{result.analysis.equipmentType}</p>
                <p className="text-muted-foreground">{result.analysis.problem}</p>
              </div>
              
              {result.analysis.problemDetails && (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {result.analysis.problemDetails}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge className={getSeverityColor(result.analysis.severity)}>
                  Sévérité: {result.analysis.severity}/5
                </Badge>
                <Badge className={getUrgencyColor(result.analysis.urgency)}>
                  {result.analysis.urgencyLabel}
                </Badge>
                <Badge variant="outline">
                  {result.analysis.serviceType}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Cost Estimate */}
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Estimation du coût
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary">
                  {result.analysis.estimatedCost.total} MAD
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fourchette: {result.analysis.estimatedCost.range.min} - {result.analysis.estimatedCost.range.max} MAD
                </p>
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Main d'œuvre</p>
                  <p className="font-semibold">{result.analysis.estimatedCost.labor} MAD</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pièces</p>
                  <p className="font-semibold">{result.analysis.estimatedCost.parts} MAD</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Durée</p>
                  <p className="font-semibold">{result.analysis.estimatedTime}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Required Parts */}
          {result.analysis.requiredParts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">🔧 Pièces nécessaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.analysis.requiredParts.map((part, i) => (
                    <Badge key={i} variant="secondary">{part}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Safety Concerns */}
          {result.analysis.safetyConcerns.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  Précautions de sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {result.analysis.safetyConcerns.map((concern, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-orange-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {concern}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.analysis.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">💡 Recommandations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.analysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Matched Technicians */}
          {result.matchedTechnicians.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Techniciens recommandés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.matchedTechnicians.slice(0, 3).map((tech, index) => (
                  <div 
                    key={tech.id}
                    className={`
                      flex items-center justify-between p-4 rounded-lg border
                      ${index === 0 ? "border-primary bg-primary/5" : ""}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={tech.photoUrl} />
                        <AvatarFallback>{tech.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{tech.name}</p>
                          {index === 0 && (
                            <Badge variant="default" className="text-xs">
                              Meilleur match
                            </Badge>
                          )}
                          {tech.isPro && (
                            <Badge variant="secondary" className="text-xs">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Pro
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {tech.rating} ({tech.reviewCount} avis)
                          <span>•</span>
                          {tech.hourlyRate} MAD/h
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleQuickBook(tech.id)}
                      disabled={bookingMutation.isPending}
                      variant={index === 0 ? "default" : "outline"}
                    >
                      {bookingMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Réserver"
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation("/technicians")}
                >
                  Voir tous les techniciens
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* New Analysis Button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={resetForm}
          >
            <Camera className="mr-2 h-4 w-4" />
            Nouveau diagnostic
          </Button>
        </div>
      )}
    </div>
  );
}


