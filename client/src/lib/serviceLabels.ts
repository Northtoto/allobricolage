// Service category labels in French
export const SERVICE_LABELS: Record<string, string> = {
  plomberie: "Plomberie",
  electricite: "Électricité",
  peinture: "Peinture",
  menuiserie: "Menuiserie",
  climatisation: "Climatisation",
  reparation_appareils: "Réparation d'appareils",
  petites_renovations: "Petites rénovations",
  portes_serrures: "Portes/Serrures",
  metallerie: "Métallerie",
  carrelage: "Carrelage",
  etancheite: "Étanchéité",
  installation_luminaires: "Installation Luminaires",
  travaux_construction: "Travaux Construction",
  services_generaux: "Services Généraux",
  maconnerie: "Maçonnerie", // Legacy support
};

// Service category icons (using emoji or icon names)
export const SERVICE_ICONS: Record<string, string> = {
  plomberie: "🔧",
  electricite: "⚡",
  peinture: "🎨",
  menuiserie: "🪚",
  climatisation: "❄️",
  reparation_appareils: "🔨",
  petites_renovations: "🏠",
  portes_serrures: "🔐",
  metallerie: "⚙️",
  carrelage: "🧱",
  etancheite: "💧",
  installation_luminaires: "💡",
  travaux_construction: "🏗️",
  services_generaux: "🛠️",
  maconnerie: "🧱",
};

export function getServiceLabel(serviceKey: string): string {
  return SERVICE_LABELS[serviceKey] || serviceKey;
}

export function getServiceIcon(serviceKey: string): string {
  return SERVICE_ICONS[serviceKey] || "🔧";
}

