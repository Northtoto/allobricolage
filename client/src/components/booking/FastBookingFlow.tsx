import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TechnicianCard } from "@/components/design/TechnicianCard";
import { CheckCircle2, Loader2, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { TechnicianWithUser } from "@shared/schema";

interface FastBookingFlowProps {
    isOpen: boolean;
    onClose: () => void;
    serviceType: string;
    isSearch?: boolean;
}

const SERVICE_MAPPING: Record<string, string> = {
    "Plomberie": "plomberie",
    "Électricité": "electricite",
    "Peinture": "peinture",
    "Menuiserie": "menuiserie",
    "Climatisation": "climatisation",
    "Réparation d'appareils": "reparation_appareils",
    "Petites rénovations": "petites_renovations",
    "Portes/Serrures": "portes_serrures",
    "Métallerie": "metallerie",
    "Carrelage": "carrelage",
    "Étanchéité": "etancheite",
    "Installation Luminaires": "installation_luminaires",
    "Travaux Construction": "travaux_construction",
    "Services Généraux": "services_generaux"
};

export function FastBookingFlow({ isOpen, onClose, serviceType, isSearch = false }: FastBookingFlowProps) {
    const [step, setStep] = useState<"searching" | "selection" | "confirming" | "auth-redirect">("searching");
    const [, setLocation] = useLocation();

    // Construct query URL
    const getQueryUrl = () => {
        const baseUrl = "/api/technicians";
        const params = new URLSearchParams();
        params.append("available", "true");

        if (isSearch) {
            params.append("search", serviceType);
        } else {
            const serviceKey = SERVICE_MAPPING[serviceType] || serviceType.toLowerCase();
            params.append("service", serviceKey);
        }
        
        return `${baseUrl}?${params.toString()}`;
    };

    // Fetch real technicians
    const { data: technicians = [], isLoading } = useQuery<TechnicianWithUser[]>({
        queryKey: ["/api/technicians", serviceType, isSearch],
        queryFn: async () => {
            const res = await fetch(getQueryUrl());
            if (!res.ok) throw new Error("Failed to fetch technicians");
            return res.json();
        },
        enabled: isOpen,
    });

    useEffect(() => {
        if (isOpen) {
            setStep("searching");
            // Ensure search animation lasts at least 2s, but also wait for data
            const timer = setTimeout(() => {
                setStep("selection");
            }, 2500); 
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleBook = () => {
        setStep("confirming");
        setTimeout(() => {
            setStep("auth-redirect");
            setTimeout(() => {
                setLocation("/signup/client");
            }, 1500);
        }, 1500);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-slate-50 border-none">
                <AnimatePresence mode="wait">

                    {/* STEP 1: SEARCHING ANIMATION */}
                    {step === "searching" && (
                        <motion.div
                            key="searching"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-[400px] relative overflow-hidden"
                        >
                            {/* Ripple Effect */}
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    className="absolute border-4 border-primary/20 rounded-full"
                                    initial={{ width: 0, height: 0, opacity: 1 }}
                                    animate={{ width: 500, height: 500, opacity: 0 }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.4,
                                        ease: "easeOut"
                                    }}
                                />
                            ))}

                            <div className="relative z-10 bg-white p-4 rounded-full shadow-xl mb-6">
                                <MapPin className="w-10 h-10 text-primary animate-bounce" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-800">Recherche de {serviceType}...</h3>
                            <p className="text-slate-500">Analyse des techniciens à proximité</p>
                        </motion.div>
                    )}

                    {/* STEP 2: SELECTION */}
                    {step === "selection" && (
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-6 h-[500px] flex flex-col"
                        >
                            <div className="mb-4">
                                <h3 className="text-2xl font-bold">{technicians.length} Techniciens trouvés</h3>
                                <p className="text-slate-500">Disponibles immédiatement</p>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                {technicians.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        Aucun technicien trouvé pour ce service dans votre zone.
                                    </div>
                                ) : (
                                    technicians.slice(0, 10).map((tech, index) => (
                                        <motion.div
                                            key={tech.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <div className="relative group cursor-pointer" onClick={handleBook}>
                                                <TechnicianCard
                                                    name={tech.name}
                                                    specialty={tech.services[0] || serviceType}
                                                    rating={tech.rating}
                                                    reviews={tech.reviewCount}
                                                    distance={`${Math.floor(Math.random() * 20) + 5} min`} // Mock distance for now
                                                    price={`${tech.hourlyRate} Dhs`}
                                                    imageUrl={tech.photo || "https://images.unsplash.com/photo-1556157382-97eda2d622ca?auto=format&fit=crop&w=400&q=80"}
                                                    verified={tech.isVerified}
                                                    onBook={handleBook}
                                                />
                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-primary/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-2 border-primary/50" />
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: CONFIRMING */}
                    {step === "confirming" && (
                        <motion.div
                            key="confirming"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-[400px] bg-white"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="mb-6"
                            >
                                <Loader2 className="w-16 h-16 text-primary" />
                            </motion.div>
                            <h3 className="text-xl font-bold">Vérification de la disponibilité...</h3>
                            <p className="text-slate-500">Veuillez patienter un instant</p>
                        </motion.div>
                    )}

                    {/* STEP 4: AUTH REDIRECT */}
                    {step === "auth-redirect" && (
                        <motion.div
                            key="auth-redirect"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center justify-center h-[400px] bg-white text-center p-6"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6"
                            >
                                <CheckCircle2 className="w-12 h-12 text-blue-600" />
                            </motion.div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Technicien Disponible !</h3>
                            <p className="text-slate-500 mb-8">
                                Redirection vers la connexion pour finaliser la réservation...
                            </p>

                            <div className="flex gap-2 w-full">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-xl"
                                    onClick={() => setLocation("/login")}
                                >
                                    Connexion
                                </Button>
                                <Button
                                    className="flex-1 rounded-xl"
                                    onClick={() => setLocation("/signup/client")}
                                >
                                    Inscription
                                </Button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
