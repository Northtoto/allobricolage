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
    <footer id="contact" className="relative mt-auto overflow-hidden border-t border-border/20">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(30,64,175,0.08)_0%,transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Voice with 3D Effect */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 group">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl shadow-primary/30 card-3d perspective-container animate-pulse-glow">
                <Wrench className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div>
                <p className="font-bold text-2xl gradient-text-animated">AlloBricolage</p>
                <p className="text-xs text-muted-foreground tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Innovation & artisans
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Réinventons le bricolage B2B avec des artisans vérifiés, une IA locale et un service pensé pour tout le Maroc.
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
                  className="p-3 rounded-xl glass-enhanced text-muted-foreground hover:text-primary hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-110 card-3d group"
                >
                  <social.icon className="h-5 w-5 group-hover:rotate-12 transition-transform" />
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
