import { Wrench, MapPin, Phone, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">AlloBricolage</span>
                <span className="text-xs text-muted-foreground leading-tight">Powered by AI</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              La plateforme intelligente pour connecter les clients avec les meilleurs artisans au Maroc.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">{t("services.title")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t("services.plomberie")}</li>
              <li>{t("services.electricite")}</li>
              <li>{t("services.peinture")}</li>
              <li>{t("services.menuiserie")}</li>
              <li>{t("services.climatisation")}</li>
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="font-semibold mb-4">Villes</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Casablanca
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Rabat
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Marrakech
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Fès
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Tanger
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-3 w-3" /> +212 5XX-XXXXXX
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3 w-3" /> contact@allobricolage.ma
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AlloBricolage. Tous droits réservés.</p>
          <p className="mt-2">Propulsé par 47 modèles d'intelligence artificielle</p>
        </div>
      </div>
    </footer>
  );
}
