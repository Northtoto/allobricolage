import { useEffect, useRef, useState } from "react";
import { Cpu, Users, Star, Clock } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

/**
 * 2026 Design: Animated Counter Stats
 * Numbers count up when scrolled into view.
 * Gradient backgrounds with subtle shimmer.
 */
const stats = [
  {
    icon: Cpu,
    value: 47,
    suffix: "",
    label: "Modèles IA",
    description: "Travaillent ensemble",
  },
  {
    icon: Users,
    value: 10000,
    suffix: "+",
    label: "Artisans",
    description: "Vérifiés au Maroc",
  },
  {
    icon: Star,
    value: 4.8,
    suffix: "/5",
    decimals: 1,
    label: "Note moyenne",
    description: "Sur 500K+ travaux",
  },
  {
    icon: Clock,
    value: 2,
    prefix: "<",
    suffix: "min",
    label: "Temps de match",
    description: "Garantie IA",
  },
];

function AnimatedCounter({ end, duration = 2000, decimals = 0 }: { end: number; duration?: number; decimals?: number }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    const startValue = 0;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (end - startValue) * eased;

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref}>
      {count.toFixed(decimals)}
    </span>
  );
}

export function Stats() {
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 relative overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary to-chart-2/80" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const delay = index * 0.15;

            return (
              <div
                key={index}
                className={`text-center group transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${delay}s` }}
                data-testid={`stat-${index}`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-5 backdrop-blur-sm ring-1 ring-white/20 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-5xl md:text-6xl font-extrabold mb-2 text-white tabular-nums">
                  {stat.prefix && <span className="text-3xl">{stat.prefix}</span>}
                  <AnimatedCounter
                    end={stat.value}
                    duration={2000 + index * 300}
                    decimals={stat.decimals ?? 0}
                  />
                  <span className="text-3xl">{stat.suffix}</span>
                </div>
                <div className="font-semibold text-white/90 text-lg mb-1">{stat.label}</div>
                <div className="text-sm text-white/70">{stat.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
