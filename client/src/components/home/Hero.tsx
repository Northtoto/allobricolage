import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Search, Cpu, CheckCircle, Clock, Sparkles } from "lucide-react";

export function Hero() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/post-job?q=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation("/post-job");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* AI Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent mb-8">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Matching intelligent des techniciens</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          {t("hero.title")}{" "}
          <span className="text-primary">{t("hero.titleHighlight")}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          {t("hero.subtitle")}
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-10">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder={t("hero.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-14 pl-12 pr-36 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              data-testid="input-hero-search"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-2 h-10 px-6"
              data-testid="button-hero-search"
            >
              {t("hero.cta")}
            </Button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium">{t("hero.trust1")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-chart-3/10">
              <CheckCircle className="h-5 w-5 text-chart-3" />
            </div>
            <span className="text-sm font-medium">{t("hero.trust2")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-chart-2/10">
              <Clock className="h-5 w-5 text-chart-2" />
            </div>
            <span className="text-sm font-medium">{t("hero.trust3")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
