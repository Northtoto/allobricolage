import { useState, useRef, useEffect, type MouseEvent } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Search, Cpu, CheckCircle, Clock, Sparkles, ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

/**
 * 2026 Design: Kinetic Typography Hero
 * - Animated gradient text with shimmer
 * - Spotlight cursor glow effect
 * - Floating/particulate background
 * - Magnetic CTA button with hover pull
 * - Staggered entrance animations
 */
export function Hero() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const { ref: heroRef, isVisible } = useScrollReveal<HTMLElement>({ threshold: 0.1 });

  // Spotlight follows mouse within hero
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!spotlightRef.current) return;
    const rect = spotlightRef.current.getBoundingClientRect();
    setSpotlightPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/post-job?q=${encodeURIComponent(searchQuery)}`);
    } else {
      setLocation("/post-job");
    }
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
    >
      {/* Spotlight glow layer */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(800px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(59,130,246,0.12), transparent 40%)`,
          transition: "background 0.15s ease-out",
        }}
      />

      {/* Floating shapes */}
      <FloatingShapes />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* AI Badge with shimmer */}
        <div
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 border border-accent/20 text-accent mb-8 backdrop-blur-sm transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
        >
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-semibold">Matching intelligent des techniciens</span>
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>

        {/* Kinetic Typography Heading */}
        <h1
          className={`text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight transition-all duration-700 delay-100 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <span className="block">{t("hero.title")}</span>
          <span className="bg-gradient-to-r from-primary via-primary to-chart-2 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            {t("hero.titleHighlight")}
          </span>
        </h1>

        {/* Subtitle with fade */}
        <p
          className={`text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          {t("hero.subtitle")}
        </p>

        {/* Search Bar with 2026 glass effect */}
        <div
          className={`relative max-w-2xl mx-auto mb-12 transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}
        >
          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-chart-2/20 to-accent/20 blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative flex items-center glass-panel p-1.5">
              <div className="absolute left-5 text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder={t("hero.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full h-14 pl-14 pr-40 rounded-xl bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-lg"
                data-testid="input-hero-search"
              />
              <Button
                onClick={handleSearch}
                className="absolute right-2.5 h-11 px-6 rounded-lg group/btn overflow-hidden"
                data-testid="button-hero-search"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t("hero.cta")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-primary/80 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              </Button>
            </div>
          </div>
        </div>

        {/* Trust Indicators with staggered fade */}
        <div
          className={`flex flex-wrap items-center justify-center gap-6 md:gap-10 transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          {[
            { icon: Cpu, text: t("hero.trust1"), color: "bg-primary/10 text-primary" },
            { icon: CheckCircle, text: t("hero.trust2"), color: "bg-chart-3/10 text-chart-3" },
            { icon: Clock, text: t("hero.trust3"), color: "bg-chart-2/10 text-chart-2" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 text-muted-foreground group"
              >
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${item.color} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Floating 3D shapes behind hero for depth
 */
function FloatingShapes() {
  return (
    <>
      <div className="floating-shape w-80 h-80 bg-primary/20 top-10 -left-20 animate-float" />
      <div className="floating-shape w-96 h-96 bg-chart-2/15 bottom-20 -right-30 animate-float-delayed" />
      <div className="floating-shape w-64 h-64 bg-chart-3/10 top-1/2 left-1/3 animate-float" style={{ animationDelay: "-3s" }} />
    </>
  );
}
