/**
 * 🎤 Voice Booking Component
 * 
 * Allows users to create bookings by speaking in Darija, French, or Arabic.
 * First in Morocco!
 */

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mic, Square, Send, Loader2, CheckCircle, Languages } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface VoiceBookingResult {
  transcription: string;
  understanding: {
    serviceType: string;
    problemDescription: string;
    urgency: string;
    detectedLanguage: string;
    confidence: number;
  };
  job: any;
  suggestedTechnicians: any[];
  oneClickBooking: any;
}

export function VoiceBooking() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<VoiceBookingResult | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const voiceBookingMutation = useMutation({
    mutationFn: async (audio: Blob) => {
      const formData = new FormData();
      formData.append("audio", audio, "recording.webm");

      const response = await fetch("/api/ai/voice-booking", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to process voice booking");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "✅ Demande comprise!",
        description: `Service: ${data.understanding.serviceType}`
      });
    },
    onError: () => {
      toast({
        title: "❌ Erreur",
        description: "Impossible de traiter l'enregistrement",
        variant: "destructive"
      });
    }
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      const chunks: BlobPart[] = [];
      mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorder.current.start();
      setRecording(true);

      toast({
        title: "🎤 Enregistrement...",
        description: "Décrivez votre problème"
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible d'accéder au microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const submitVoiceBooking = () => {
    if (audioBlob) {
      voiceBookingMutation.mutate(audioBlob);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setResult(null);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mic className="h-6 w-6 text-primary" />
          Réservation Vocale
        </CardTitle>
        <CardDescription>
          Décrivez votre problème en parlant
        </CardDescription>
        <div className="flex justify-center gap-2 mt-2">
          <Badge variant="outline">🇫🇷 Français</Badge>
          <Badge variant="outline">🇲🇦 Darija</Badge>
          <Badge variant="outline">🇸🇦 العربية</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!result ? (
          <>
            {/* Recording Button */}
            <Button
              variant={recording ? "destructive" : "default"}
              size="lg"
              className="w-full h-20 text-lg"
              onClick={recording ? stopRecording : startRecording}
              disabled={voiceBookingMutation.isPending}
            >
              {recording ? (
                <>
                  <Square className="mr-2 h-6 w-6 animate-pulse" />
                  Arrêter l'enregistrement
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-6 w-6" />
                  Appuyer pour parler
                </>
              )}
            </Button>

            {/* Audio Preview */}
            {audioBlob && !recording && (
              <div className="space-y-3">
                <audio 
                  controls 
                  src={URL.createObjectURL(audioBlob)} 
                  className="w-full"
                />
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetRecording}
                    className="flex-1"
                  >
                    Réenregistrer
                  </Button>
                  <Button
                    onClick={submitVoiceBooking}
                    disabled={voiceBookingMutation.isPending}
                    className="flex-1"
                  >
                    {voiceBookingMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyse...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!audioBlob && !recording && (
              <div className="text-sm text-muted-foreground text-center space-y-2">
                <p>💡 Exemples de ce que vous pouvez dire:</p>
                <ul className="space-y-1">
                  <li>"J'ai une fuite d'eau dans la cuisine"</li>
                  <li>"الماء غادي فالكوزينة"</li>
                  <li>"Ma climatisation ne fonctionne plus"</li>
                </ul>
              </div>
            )}
          </>
        ) : (
          /* Result Display */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Demande comprise!</span>
            </div>

            {/* Transcription */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Transcription:</p>
              <p className="font-medium">{result.transcription}</p>
            </div>

            {/* Understanding */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <Badge>{result.understanding.serviceType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Urgence:</span>
                <Badge variant={result.understanding.urgency === "urgent" ? "destructive" : "outline"}>
                  {result.understanding.urgency}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Langue détectée:</span>
                <Badge variant="outline">
                  <Languages className="h-3 w-3 mr-1" />
                  {result.understanding.detectedLanguage}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confiance:</span>
                <span>{Math.round(result.understanding.confidence * 100)}%</span>
              </div>
            </div>

            {/* Problem Description */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Description:</p>
              <p>{result.understanding.problemDescription}</p>
            </div>

            {/* Suggested Technician */}
            {result.oneClickBooking && (
              <div className="p-4 border rounded-lg">
                <p className="font-semibold mb-2">🎯 Technicien recommandé:</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{result.oneClickBooking.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {result.oneClickBooking.rating}★ • {result.oneClickBooking.hourlyRate} MAD/h
                    </p>
                  </div>
                  <Button size="sm">
                    Réserver
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetRecording}
                className="flex-1"
              >
                Nouvelle demande
              </Button>
              <Button className="flex-1">
                Voir tous les techniciens
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

