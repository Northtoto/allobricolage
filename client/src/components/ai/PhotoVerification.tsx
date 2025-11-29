/**
 * 📸 Photo Verification Component
 * 
 * Allows technicians to upload before/after photos
 * for AI verification of work completion.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, CheckCircle, XCircle, AlertTriangle, Loader2, Star } from "lucide-react";

interface VerificationResult {
  problemFixed: boolean;
  qualityRating: number;
  remainingIssues: string[];
  recommendation: "approve" | "review" | "reject";
  explanation: string;
  confidence: number;
  details: {
    beforeAnalysis: string;
    afterAnalysis: string;
    improvementDescription: string;
  };
}

interface PhotoVerificationProps {
  bookingId: string;
  jobDescription: string;
  serviceType: string;
  onVerificationComplete?: (result: VerificationResult) => void;
}

export function PhotoVerification({
  bookingId,
  jobDescription,
  serviceType,
  onVerificationComplete
}: PhotoVerificationProps) {
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string>("");
  const [afterPreview, setAfterPreview] = useState<string>("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!beforePhoto || !afterPhoto) {
        throw new Error("Both photos are required");
      }

      const formData = new FormData();
      formData.append("beforePhoto", beforePhoto);
      formData.append("afterPhoto", afterPhoto);
      formData.append("jobDescription", jobDescription);
      formData.append("serviceType", serviceType);

      const response = await fetch("/api/ai/verify-work", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      onVerificationComplete?.(data);
      
      if (data.recommendation === "approve") {
        toast({
          title: "✅ Travail vérifié!",
          description: `Qualité: ${data.qualityRating}/5 étoiles`
        });
      } else if (data.recommendation === "review") {
        toast({
          title: "⚠️ Vérification manuelle requise",
          description: "Un superviseur va examiner le travail",
          variant: "default"
        });
      } else {
        toast({
          title: "❌ Travail non approuvé",
          description: data.explanation,
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "❌ Erreur",
        description: "Impossible de vérifier les photos",
        variant: "destructive"
      });
    }
  });

  const handlePhotoSelect = (type: "before" | "after", file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "before") {
        setBeforePhoto(file);
        setBeforePreview(reader.result as string);
      } else {
        setAfterPhoto(file);
        setAfterPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const getRecommendationIcon = () => {
    switch (result?.recommendation) {
      case "approve":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "review":
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case "reject":
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getRecommendationColor = () => {
    switch (result?.recommendation) {
      case "approve": return "bg-green-50 border-green-200";
      case "review": return "bg-yellow-50 border-yellow-200";
      case "reject": return "bg-red-50 border-red-200";
      default: return "";
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" />
          Vérification du Travail
        </CardTitle>
        <CardDescription>
          Téléchargez les photos avant et après pour vérification AI
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!result ? (
          <>
            {/* Photo Upload Section */}
            <div className="grid grid-cols-2 gap-4">
              {/* Before Photo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Photo AVANT</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    beforePreview ? "border-primary" : "border-muted hover:border-primary"
                  }`}
                  onClick={() => document.getElementById("before-photo")?.click()}
                >
                  {beforePreview ? (
                    <img
                      src={beforePreview}
                      alt="Before"
                      className="w-full h-40 object-cover rounded"
                    />
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                      <Upload className="h-8 w-8 mb-2" />
                      <span className="text-sm">Cliquez pour télécharger</span>
                    </div>
                  )}
                </div>
                <input
                  id="before-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhotoSelect("before", e.target.files[0])}
                />
              </div>

              {/* After Photo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Photo APRÈS</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    afterPreview ? "border-primary" : "border-muted hover:border-primary"
                  }`}
                  onClick={() => document.getElementById("after-photo")?.click()}
                >
                  {afterPreview ? (
                    <img
                      src={afterPreview}
                      alt="After"
                      className="w-full h-40 object-cover rounded"
                    />
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                      <Upload className="h-8 w-8 mb-2" />
                      <span className="text-sm">Cliquez pour télécharger</span>
                    </div>
                  )}
                </div>
                <input
                  id="after-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhotoSelect("after", e.target.files[0])}
                />
              </div>
            </div>

            {/* Job Info */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Description du travail:</p>
              <p className="font-medium">{jobDescription}</p>
              <Badge className="mt-2">{serviceType}</Badge>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={() => verifyMutation.mutate()}
              disabled={!beforePhoto || !afterPhoto || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Vérifier le travail
                </>
              )}
            </Button>
          </>
        ) : (
          /* Results Section */
          <div className="space-y-4">
            {/* Main Result */}
            <div className={`p-4 rounded-lg border ${getRecommendationColor()}`}>
              <div className="flex items-center gap-3">
                {getRecommendationIcon()}
                <div>
                  <h3 className="font-semibold text-lg">
                    {result.recommendation === "approve" && "Travail Approuvé"}
                    {result.recommendation === "review" && "Vérification Manuelle Requise"}
                    {result.recommendation === "reject" && "Travail Non Approuvé"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Confiance: {Math.round(result.confidence * 100)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Quality Rating */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">Qualité du travail:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= result.qualityRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 font-bold">{result.qualityRating}/5</span>
              </div>
            </div>

            {/* Explanation */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Explication:</p>
              <p>{result.explanation}</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">État avant:</p>
                <p className="text-sm">{result.details.beforeAnalysis}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">État après:</p>
                <p className="text-sm">{result.details.afterAnalysis}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">Améliorations:</p>
                <p className="text-sm">{result.details.improvementDescription}</p>
              </div>
            </div>

            {/* Remaining Issues */}
            {result.remainingIssues.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-2">Problèmes restants:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {result.remainingIssues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setBeforePhoto(null);
                  setAfterPhoto(null);
                  setBeforePreview("");
                  setAfterPreview("");
                }}
                className="flex-1"
              >
                Nouvelle vérification
              </Button>
              {result.recommendation === "approve" && (
                <Button className="flex-1">
                  Terminer le travail
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

