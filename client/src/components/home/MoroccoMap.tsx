import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";

// REAL MOROCCAN CITIES WITH ACCURATE MAP POSITIONS
const moroccanCities = [
  {
    id: 1,
    name: "Casablanca",
    x: "33%",
    y: "38%",
    technicians: 85,
    delay: 0,
    color: "text-blue-500",
    size: "large" // Economic capital
  },
  {
    id: 2,
    name: "Rabat",
    x: "34%",
    y: "32%",
    technicians: 62,
    delay: 0.2,
    color: "text-green-500",
    size: "large" // Capital
  },
  {
    id: 3,
    name: "Marrakech",
    x: "38%",
    y: "55%",
    technicians: 78,
    delay: 0.4,
    color: "text-orange-500",
    size: "large" // Tourist hub
  },
  {
    id: 4,
    name: "Fès",
    x: "47%",
    y: "30%",
    technicians: 54,
    delay: 0.6,
    color: "text-purple-500",
    size: "medium"
  },
  {
    id: 5,
    name: "Tanger",
    x: "35%",
    y: "15%",
    technicians: 48,
    delay: 0.8,
    color: "text-cyan-500",
    size: "medium"
  },
  {
    id: 6,
    name: "Agadir",
    x: "25%",
    y: "70%",
    technicians: 42,
    delay: 1.0,
    color: "text-yellow-500",
    size: "medium"
  },
  {
    id: 7,
    name: "Meknès",
    x: "45%",
    y: "33%",
    technicians: 36,
    delay: 1.2,
    color: "text-pink-500",
    size: "small"
  },
  {
    id: 8,
    name: "Oujda",
    x: "75%",
    y: "32%",
    technicians: 28,
    delay: 1.4,
    color: "text-indigo-500",
    size: "small"
  },
  {
    id: 9,
    name: "Kenitra",
    x: "35%",
    y: "30%",
    technicians: 24,
    delay: 1.6,
    color: "text-teal-500",
    size: "small"
  },
  {
    id: 10,
    name: "Tétouan",
    x: "38%",
    y: "18%",
    technicians: 22,
    delay: 1.8,
    color: "text-rose-500",
    size: "small"
  },
];

// SVG Path for Morocco border (simplified)
const MOROCCO_PATH = `
  M 200 80
  L 380 80
  L 420 120
  L 450 180
  L 460 240
  L 450 300
  L 430 360
  L 400 420
  L 360 460
  L 300 480
  L 240 460
  L 180 420
  L 150 360
  L 140 300
  L 150 240
  L 170 180
  L 190 120
  Z
`;

export function MoroccoMap() {
  const [loaded, setLoaded] = useState(false);
  const [hoveredCity, setHoveredCity] = useState<number | null>(null);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const getPinSize = (size: string) => {
    switch (size) {
      case "large": return "w-10 h-10";
      case "medium": return "w-8 h-8";
      case "small": return "w-6 h-6";
      default: return "w-8 h-8";
    }
  };

  const getPulseSize = (size: string) => {
    switch (size) {
      case "large": return "-inset-6";
      case "medium": return "-inset-4";
      case "small": return "-inset-3";
      default: return "-inset-4";
    }
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">

      {/* Morocco Map SVG Outline */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        viewBox="0 0 600 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <motion.path
          d={MOROCCO_PATH}
          fill="url(#mapGradient)"
          stroke="#3b82f6"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </svg>

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, #3b82f6 1px, transparent 1px),
            linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Overlay Gradient for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-white/80" />

      {/* Animated Connection Lines (between cities) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {moroccanCities.slice(0, 5).map((city, index) => {
          const nextCity = moroccanCities[(index + 1) % 5];
          return (
            <motion.line
              key={`line-${city.id}`}
              x1={city.x}
              y1={city.y}
              x2={nextCity.x}
              y2={nextCity.y}
              stroke={city.color.replace('text-', '')}
              strokeWidth="1"
              strokeDasharray="5,5"
              className="opacity-20"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: loaded ? 1 : 0 }}
              transition={{ delay: city.delay + 0.5, duration: 1 }}
            />
          );
        })}
      </svg>

      {/* City Location Pins */}
      {moroccanCities.map((city) => (
        <motion.div
          key={city.id}
          className="absolute cursor-pointer group"
          style={{ left: city.x, top: city.y, zIndex: hoveredCity === city.id ? 50 : 10 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={loaded ? { scale: 1, opacity: 1 } : {}}
          transition={{
            delay: city.delay,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          onMouseEnter={() => setHoveredCity(city.id)}
          onMouseLeave={() => setHoveredCity(null)}
          whileHover={{ scale: 1.3, zIndex: 100 }}
        >
          {/* Pulsing Ripple Effect */}
          <motion.div
            className={`absolute ${getPulseSize(city.size)} rounded-full bg-current opacity-20 ${city.color}`}
            animate={{
              scale: [1, 2.5, 1],
              opacity: [0.3, 0, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: city.delay
            }}
          />

          {/* Pin Icon */}
          <motion.div
            className={`relative z-10 p-2 bg-white rounded-full shadow-xl ${city.color} ring-2 ring-white`}
            whileHover={{
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
              y: -5
            }}
          >
            <MapPin className={`${getPinSize(city.size)} fill-current drop-shadow-lg`} />
          </motion.div>

          {/* Hover Tooltip */}
          <motion.div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-200 whitespace-nowrap pointer-events-none"
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{
              opacity: hoveredCity === city.id ? 1 : 0,
              y: hoveredCity === city.id ? 0 : -10,
              scale: hoveredCity === city.id ? 1 : 0.8
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-1">
              <p className="font-bold text-sm text-slate-800">{city.name}</p>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Users className="w-3 h-3" />
                <span className="font-semibold">{city.technicians} techniciens</span>
              </div>
              <div className="text-[10px] text-primary font-medium">
                ⚡ Disponible maintenant
              </div>
            </div>

            {/* Tooltip Arrow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45" />
          </motion.div>

          {/* Availability Badge (for large cities) */}
          {city.size === "large" && (
            <motion.div
              className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg z-20"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: city.delay + 0.5
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}

      {/* User's Current Location (Center of Morocco - symbolic) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 5 }}>
        <motion.div
          className="w-6 h-6 bg-blue-600 rounded-full shadow-2xl ring-4 ring-white relative"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(37, 99, 235, 0.7)",
              "0 0 0 30px rgba(37, 99, 235, 0)"
            ]
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
        </motion.div>
      </div>

      {/* Stats Overlay (Top Left) */}
      <motion.div
        className="absolute top-8 left-8 glass-enhanced p-4 rounded-2xl space-y-2 max-w-xs z-20"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">Techniciens actifs</p>
            <p className="text-2xl font-bold text-slate-800">
              {moroccanCities.reduce((sum, city) => sum + city.technicians, 0)}+
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Couvrant {moroccanCities.length} villes principales du Maroc
        </p>
      </motion.div>

      {/* Legend (Bottom Right) */}
      <motion.div
        className="absolute bottom-8 right-8 glass-enhanced p-3 rounded-xl space-y-2 z-20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.6 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-slate-700 font-medium">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-slate-700 font-medium">Techniciens</span>
        </div>
      </motion.div>
    </div>
  );
}
