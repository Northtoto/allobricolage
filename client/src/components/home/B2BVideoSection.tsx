import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Building2, Users, TrendingUp, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function B2BVideoSection() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [, setLocation] = useLocation();

    return (
        <section className="py-24 relative overflow-hidden bg-slate-950 text-white">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,64,175,0.2)_0%,transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.2)_0%,transparent_50%)]" />

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Text Content */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="space-y-4"
                        >
                            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold uppercase tracking-wider border border-blue-500/30">
                                AlloBricolage Business
                            </span>
                            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                                La solution maintenance pour <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">votre entreprise</span>
                            </h2>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                Optimisez la gestion de vos locaux avec notre offre dédiée aux professionnels.
                                Interventions prioritaires, facturation centralisée et reporting détaillé.
                            </p>
                        </motion.div>

                        <div className="space-y-4">
                            {[
                                { icon: Building2, text: "Gestion multi-sites simplifiée" },
                                { icon: Users, text: "Équipes dédiées et vérifiées" },
                                { icon: TrendingUp, text: "Réduction des coûts de maintenance" },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <span className="font-medium">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            viewport={{ once: true }}
                            className="pt-4"
                        >
                            <Button
                                size="lg"
                                className="rounded-full px-8 py-6 text-lg bg-white text-slate-950 hover:bg-blue-50 hover:scale-105 transition-all"
                                onClick={() => setLocation("/signup/business")}
                            >
                                Découvrir l'offre Business
                            </Button>
                        </motion.div>
                    </div>

                    {/* Video Player UI */}
                    <Dialog open={isPlaying} onOpenChange={setIsPlaying}>
                        <DialogTrigger asChild>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 group cursor-pointer"
                                onClick={() => setIsPlaying(true)}
                            >
                                {/* Thumbnail Image */}
                                <img
                                    src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80"
                                    alt="AlloBricolage Business Meeting"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />

                                {/* Play Button */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div
                                        className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-blue-600 transition-all duration-300 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                                    >
                                        <Play className="h-8 w-8 fill-current ml-1" />
                                    </div>
                                </div>

                                {/* Video UI Elements */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-400 mb-1">NOUVEAU</p>
                                            <p className="text-xl font-bold">AlloBricolage pour les Pros</p>
                                        </div>
                                        <div className="px-3 py-1 rounded-md bg-black/50 backdrop-blur text-xs font-mono border border-white/10">
                                            01:45
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] p-0 bg-black border-none overflow-hidden">
                            <div className="relative aspect-video">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/M7lc1UVf-VE?autoplay=1"
                                    title="AlloBricolage Business Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>
        </section>
    );
}
