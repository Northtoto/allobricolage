import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";

// Mock technician locations
const technicians = [
    { id: 1, x: "20%", y: "30%", delay: 0, color: "text-blue-500" },
    { id: 2, x: "60%", y: "25%", delay: 0.5, color: "text-green-500" },
    { id: 3, x: "40%", y: "60%", delay: 1, color: "text-orange-500" },
    { id: 4, x: "80%", y: "70%", delay: 1.5, color: "text-blue-500" },
    { id: 5, x: "15%", y: "80%", delay: 2, color: "text-green-500" },
];

export function MapBackground() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setLoaded(true);
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-50">
            {/* Map Image (Grayscale/Muted for better contrast) */}
            <div
                className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80')] bg-cover bg-center grayscale"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white/90" />

            {/* Pulsing Pins */}
            {technicians.map((tech) => (
                <motion.div
                    key={tech.id}
                    className="absolute"
                    style={{ left: tech.x, top: tech.y }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={loaded ? { scale: 1, opacity: 1 } : {}}
                    transition={{
                        delay: tech.delay,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                    }}
                >
                    {/* Pulse Effect */}
                    <motion.div
                        className={`absolute -inset-4 rounded-full bg-current opacity-20 ${tech.color}`}
                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Pin Icon */}
                    <div className={`relative z-10 p-2 bg-white rounded-full shadow-lg ${tech.color}`}>
                        <MapPin className="w-6 h-6 fill-current" />
                    </div>

                    {/* Tooltip (Optional) */}
                    <motion.div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-white rounded-md shadow-md text-[10px] font-bold whitespace-nowrap opacity-0"
                        animate={{ opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 4, repeat: Infinity, delay: tech.delay + 1 }}
                    >
                        12 min
                    </motion.div>
                </motion.div>
            ))}

            {/* User Location Pulse (Center) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                    className="w-4 h-4 bg-blue-600 rounded-full shadow-xl ring-4 ring-white"
                    animate={{ boxShadow: ["0 0 0 0 rgba(37, 99, 235, 0.4)", "0 0 0 20px rgba(37, 99, 235, 0)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </div>
        </div>
    );
}
