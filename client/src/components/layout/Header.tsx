import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Sun, Moon, Menu, X, Wrench, Building2, LogOut } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const { user, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Succès", description: "Déconnecté avec succès" });
      setLocation("/");
    } catch {
      toast({ title: "Erreur", description: "Erreur lors de la déconnexion", variant: "destructive" });
    }
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === "technician") {
      return { href: "/technician-dashboard", label: t("nav.forTech") };
    }
    return { href: "/client-dashboard", label: t("nav.forClient") };
  };

  const dashboardLink = getDashboardLink();
  
  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/post-job", label: t("nav.postJob") },
    ...(dashboardLink ? [dashboardLink] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-home">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">AlloBricolage</span>
                <span className="text-xs text-muted-foreground leading-tight">Powered by AI</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  size="sm"
                  data-testid={`link-nav-${link.href.replace("/", "") || "home"}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              data-testid="button-language-toggle"
              className="font-medium"
            >
              {lang === "fr" ? "العربية" : "Français"}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Auth Section - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {!isLoading && (
                user ? (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {user.name || user.username}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm" data-testid="link-login">
                        Connexion
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm" data-testid="link-signup">
                        Inscription
                      </Button>
                    </Link>
                  </>
                )
              )}
            </div>

            {/* CTA Button - Desktop */}
            {user && (
              <Link href="/post-job" className="hidden md:block">
                <Button data-testid="button-header-post-job">
                  <Building2 className="h-4 w-4 mr-2" />
                  {t("nav.postJob")}
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-nav-${link.href.replace("/", "") || "home"}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            {user && (
              <Link href="/post-job">
                <Button className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="button-mobile-post-job">
                  <Building2 className="h-4 w-4 mr-2" />
                  {t("nav.postJob")}
                </Button>
              </Link>
            )}
            <div className="border-t border-border pt-2">
              {user ? (
                <>
                  <div className="px-2 py-2 text-sm text-muted-foreground">
                    {user.name || user.username}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    data-testid="button-mobile-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-mobile-login"
                    >
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-mobile-signup"
                    >
                      Inscription
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
