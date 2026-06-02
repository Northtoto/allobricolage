import {
  Droplets, Zap, Paintbrush, Hammer, Snowflake, Grid3x3, ShieldCheck,
  Cog, Sparkles, Home, KeyRound, Lightbulb, Building2, Trees, Wrench,
  type LucideIcon,
} from "lucide-react";

interface ServiceMeta {
  icon: LucideIcon;
  gradient: string; // tailwind from/to classes
  label: string;
}

// Maps a service slug to its trade icon, brand gradient, and FR label.
// Used instead of (often missing/stock) technician photos so a card always shows
// a clean, on-brand representation of the TYPE of service provider.
const SERVICE_META: Record<string, ServiceMeta> = {
  plomberie: { icon: Droplets, gradient: "from-blue-500 to-cyan-500", label: "Plomberie" },
  electricite: { icon: Zap, gradient: "from-amber-500 to-yellow-500", label: "Électricité" },
  peinture: { icon: Paintbrush, gradient: "from-violet-500 to-fuchsia-500", label: "Peinture" },
  menuiserie: { icon: Hammer, gradient: "from-orange-600 to-amber-600", label: "Menuiserie" },
  climatisation: { icon: Snowflake, gradient: "from-sky-400 to-cyan-500", label: "Climatisation" },
  carrelage: { icon: Grid3x3, gradient: "from-teal-500 to-emerald-500", label: "Carrelage" },
  etancheite: { icon: ShieldCheck, gradient: "from-sky-600 to-blue-600", label: "Étanchéité" },
  metallerie: { icon: Cog, gradient: "from-slate-500 to-zinc-600", label: "Métallerie" },
  nettoyage: { icon: Sparkles, gradient: "from-green-500 to-emerald-500", label: "Nettoyage" },
  reparation_appareils: { icon: Cog, gradient: "from-indigo-500 to-blue-600", label: "Réparation d'appareils" },
  petites_renovations: { icon: Home, gradient: "from-stone-500 to-amber-700", label: "Petites rénovations" },
  portes_serrures: { icon: KeyRound, gradient: "from-zinc-500 to-slate-600", label: "Portes & Serrures" },
  serrurerie: { icon: KeyRound, gradient: "from-zinc-500 to-slate-600", label: "Serrurerie" },
  installation_luminaires: { icon: Lightbulb, gradient: "from-yellow-400 to-amber-500", label: "Luminaires" },
  travaux_construction: { icon: Building2, gradient: "from-orange-600 to-red-600", label: "Construction" },
  maconnerie: { icon: Building2, gradient: "from-stone-500 to-stone-700", label: "Maçonnerie" },
  jardinage: { icon: Trees, gradient: "from-green-600 to-lime-600", label: "Jardinage" },
  services_generaux: { icon: Wrench, gradient: "from-slate-500 to-gray-600", label: "Services généraux" },
};

const DEFAULT_META: ServiceMeta = { icon: Wrench, gradient: "from-slate-500 to-gray-600", label: "Bricolage" };

export function getServiceMeta(service?: string): ServiceMeta {
  if (!service) return DEFAULT_META;
  return SERVICE_META[service.toLowerCase().trim()] ?? DEFAULT_META;
}

interface ServiceAvatarProps {
  service?: string;
  /** "tile" = small rounded square (lists); "banner" = full-width header. */
  variant?: "tile" | "banner";
  className?: string;
}

export function ServiceAvatar({ service, variant = "tile", className = "" }: ServiceAvatarProps) {
  const { icon: Icon, gradient, label } = getServiceMeta(service);

  if (variant === "banner") {
    return (
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${gradient} ${className}`}
        role="img"
        aria-label={label}
      >
        <Icon className="w-14 h-14 text-white/95" strokeWidth={1.5} />
        <span className="text-white/90 text-sm font-semibold tracking-wide">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
      role="img"
      aria-label={label}
    >
      <Icon className="w-1/2 h-1/2 text-white" strokeWidth={1.75} />
    </div>
  );
}
