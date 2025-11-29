import { Wrench, MapPin, Phone, Mail, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  const socials = [
    { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
    { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
    { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
    { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
  ];

  return (
    <footer id="contact" className="bg-gradient-to-b from-background via-card to-background border-t border-border/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Voice */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-xl">AlloBricolage</p>
                <p className="text-xs text-muted-foreground tracking-wide">Innovation & artisans du Maroc</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nous réinventons le bricolage B2B avec des artisans vérifiés, une IA locale et un service pensé pour Casablanca, Rabat,
              Marrakech et toutes les villes dynamiques du Royaume.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/" className="hover:text-foreground transition-colors">Accueil</a></li>
              <li><a href="#services" className="hover:text-foreground transition-colors">Services</a></li>
              <li><a href="/post-job" className="hover:text-foreground transition-colors">Booking</a></li>
              <li><a href="#about" className="hover:text-foreground transition-colors">À propos</a></li>
              <li><a href="#stories" className="hover:text-foreground transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Service Areas */}
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

          {/* Contact & Social */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-center gap-2">
                <MapPin className="h-3 w-3" /> 12 Rue des Fleurs, Casablanca
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3 w-3" /> +212 5XX 123 456
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3 w-3" /> contact@allobricolage.ma
              </li>
            </ul>
            <div className="flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="p-2 rounded-full border border-border/70 text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 mt-12 pt-8 text-sm text-muted-foreground flex flex-col md:flex-row gap-4 items-center justify-between">
          <p>&copy; {new Date().getFullYear()} AlloBricolage. Tous droits réservés.</p>
          <div className="flex gap-4 text-xs">
            <a href="/privacy" className="hover:text-foreground">Politique de confidentialité</a>
            <a href="/terms" className="hover:text-foreground">Conditions d'utilisation</a>
            <a href="mailto:contact@allobricolage.ma" className="hover:text-foreground">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
