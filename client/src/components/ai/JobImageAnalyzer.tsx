import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Loader2, CheckCircle2, AlertTriangle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface AnalysisResult {
    service: string;
    subServices: string[];
    urgency: string;
    complexity: string;
    estimatedDuration: string;
    confidence: number;
}

interface CostEstimate {
    minCost: number;
    likelyCost: number;
    maxCost: number;
    explanation: string;
}

export function JobImageAnalyzer() {
    const [image, setImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<{ analysis: AnalysisResult; costEstimate: CostEstimate } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Image trop lourde",
                description: "La taille de l'image ne doit pas dépasser 5MB",
                variant: "destructive",
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
            setResult(null);
        };
        reader.readAsDataURL(file);
    };

    const analyzeImage = async () => {
        if (!image) return;

        setIsAnalyzing(true);
        try {
            const response = await apiRequest("POST", "/api/jobs/analyze-image", {
                imageData: image,
                city: "Casablanca", // Default for quick analysis
                description: "Analyse rapide par image"
            });

            const data = await response.json();
            setResult(data);
            toast({
                title: "Analyse terminée !",
                description: "Notre IA a identifié votre problème.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Erreur",
                description: "Impossible d'analyser l'image. Réessayez.",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleBooking = () => {
        // Navigate to post-job with pre-filled data (in a real app, we'd pass state)
        // For now, just go to the page
        setLocation("/post-job");
    };

    return (
        <section className="py-16 relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-10">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-500 text-sm font-semibold uppercase tracking-wider mb-4">
                        Nouveau : IA Vision
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Diagnostiquez votre problème en <span className="text-purple-600">une photo</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Prenez une photo de la fuite, de la panne ou des travaux à réaliser.
                        Notre IA analyse la situation et estime le coût instantanément.
                    </p>
                </div>

                <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-8">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            {/* Upload Section */}
                            <div className="space-y-6">
                                <div
                                    className={`relative aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${image ? 'border-purple-500 bg-purple-100/20' : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                                        }`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {image ? (
                                        <>
                                            <img src={image} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="absolute top-2 right-2 h-8 w-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setImage(null);
                                                    setResult(null);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Upload className="w-8 h-8 text-purple-600" />
                                            </div>
                                            <p className="font-semibold text-lg mb-1">Cliquez pour uploader</p>
                                            <p className="text-sm text-muted-foreground">ou glissez votre photo ici</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                <Button
                                    className="w-full text-lg h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                    disabled={!image || isAnalyzing}
                                    onClick={analyzeImage}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Analyse en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="mr-2 h-5 w-5" />
                                            Lancer le diagnostic IA
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Results Section */}
                            <div className="relative min-h-[300px] flex flex-col justify-center">
                                <AnimatePresence mode="wait">
                                    {result ? (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                                    <CheckCircle2 className="text-green-500 h-6 w-6" />
                                                    Diagnostic terminé
                                                </h3>
                                                <div className="p-4 bg-white rounded-xl shadow-sm border border-purple-100 space-y-3">
                                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                        <span className="text-muted-foreground">Service détecté</span>
                                                        <span className="font-bold text-purple-700 capitalize">{result.analysis.service}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                        <span className="text-muted-foreground">Urgence</span>
                                                        <span className={`font-bold capitalize px-2 py-0.5 rounded text-sm ${result.analysis.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                                                            result.analysis.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {result.analysis.urgency}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-muted-foreground">Estimation</span>
                                                        <span className="font-bold text-green-600 text-lg">
                                                            {result.costEstimate.minCost} - {result.costEstimate.maxCost} MAD
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 flex gap-3">
                                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                                <p>{result.costEstimate.explanation}</p>
                                            </div>

                                            <Button onClick={handleBooking} variant="outline" className="w-full border-purple-200 hover:bg-purple-50 text-purple-700">
                                                Réserver un technicien maintenant
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center text-muted-foreground space-y-4"
                                        >
                                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                                <Sparkles className="h-10 w-10 text-gray-400" />
                                            </div>
                                            <p>
                                                L'intelligence artificielle analysera votre image pour identifier le problème et estimer le coût.
                                            </p>
                                            <div className="flex flex-wrap justify-center gap-2 text-xs">
                                                <span className="px-2 py-1 bg-gray-100 rounded-md">Fuite d'eau</span>
                                                <span className="px-2 py-1 bg-gray-100 rounded-md">Fissure murale</span>
                                                <span className="px-2 py-1 bg-gray-100 rounded-md">Prise cassée</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
