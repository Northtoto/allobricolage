import { motion } from "framer-motion";
import { Star, MapPin, ShieldCheck, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TechnicianCardProps {
    name: string;
    specialty: string;
    rating: number;
    reviews: number;
    distance: string;
    price: string;
    imageUrl: string;
    verified?: boolean;
    onBook?: () => void;
}

export function TechnicianCard({
    name,
    specialty,
    rating,
    reviews,
    distance,
    price,
    imageUrl,
    verified = true,
    onBook
}: TechnicianCardProps) {
    return (
        <motion.div
            className="bg-white rounded-3xl p-4 shadow-lg border border-border/50 flex gap-4 items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-slate-100">
                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                </div>
                {verified && (
                    <motion.div
                        className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <ShieldCheck className="w-5 h-5 text-green-500 fill-green-50" />
                    </motion.div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg truncate">{name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{specialty}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-sm font-bold">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {rating}
                        </div>
                        <span className="text-xs text-muted-foreground">({reviews})</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                        <MapPin className="w-3 h-3" /> {distance}
                    </span>
                    <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md">
                        {price}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600">
                    <MessageCircle className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-green-50 hover:text-green-600">
                    <Phone className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}
