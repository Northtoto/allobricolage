import { motion } from "framer-motion";
import { ArrowRight, Clock, Star, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceCardProps {
    title: string;
    icon: React.ElementType;
    price: string;
    rating: number;
    eta: string;
    color: string;
    onClick?: () => void;
}

export function ServiceCard({ title, icon: Icon, price, rating, eta, color, onClick }: ServiceCardProps) {
    return (
        <motion.div
            className="group relative bg-white rounded-2xl p-4 shadow-sm border border-border/50 cursor-pointer overflow-hidden"
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            {/* 3D Gradient Background Effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold text-slate-700">{rating}</span>
                    </div>
                </div>

                {/* Content */}
                <h3 className="font-bold text-lg mb-1 text-slate-900 group-hover:text-primary transition-colors">
                    {title}
                </h3>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{eta}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Banknote className="w-3 h-3" />
                        <span>{price}</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-medium text-primary">Réserver</span>
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <ArrowRight className="w-3 h-3" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
