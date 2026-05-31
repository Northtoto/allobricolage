import { useEffect, useRef, useState } from "react";

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * 2026 Design Pattern: Scroll-Triggered Reveal
 * Elements animate in as they enter the viewport.
 * Uses Intersection Observer for performance.
 */
export function useScrollReveal<T extends HTMLElement>({
  threshold = 0.15,
  rootMargin = "0px 0px -50px 0px",
  triggerOnce = true,
}: UseScrollRevealOptions = {}) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

/**
 * Staggered reveal for grids — calculates delay based on index
 */
export function useStaggeredReveal<T extends HTMLElement>(
  itemCount: number,
  baseDelay = 0.08
) {
  const containerRef = useRef<T>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll("[data-reveal-index]");
    const observers: IntersectionObserver[] = [];

    items.forEach((item, i) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleItems((prev) => new Set([...prev, i]));
            }, i * baseDelay * 1000);
            observer.unobserve(item);
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
      );
      observer.observe(item);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [itemCount, baseDelay]);

  return { containerRef, visibleItems };
}
