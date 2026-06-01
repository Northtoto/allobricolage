import { useRef, useState, type ReactNode, type MouseEvent, type CSSProperties } from "react";

/**
 * 2026 Design Pattern: Spotlight/Glow Effect Card
 * A subtle glow follows the cursor inside the card.
 * Creates tactile, interactive depth.
 * Inspired by Vercel's Spotlight component and Linear's interactive elements.
 */
interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  style?: CSSProperties;
}

export function SpotlightCard({
  children,
  className = "",
  glowColor = "rgba(59, 130, 246, 0.15)",
  style,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden group ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Spotlight glow */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: isHovering
            ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 40%)`
            : "none",
        }}
      />
      {children}
    </div>
  );
}
