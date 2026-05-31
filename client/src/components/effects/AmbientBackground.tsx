import { useEffect, useRef } from "react";

interface AmbientBackgroundProps {
  children: React.ReactNode;
  intensity?: "low" | "medium" | "high";
}

/**
 * 2026 Design Pattern: Ambient Gradient Mesh Background
 * Slowly shifting color blobs create depth without distraction.
 * Inspired by Apple Vision Pro spatial backgrounds and Stripe's landing pages.
 */
export function AmbientBackground({ children, intensity = "medium" }: AmbientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const opacityMap = {
    low: 0.3,
    medium: 0.5,
    high: 0.8,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Color palette inspired by Moroccan landscapes + brand colors
    const colors = [
      { r: 30, g: 64, b: 175 },   // Royal Blue
      { r: 234, g: 88, b: 12 },   // Terracotta
      { r: 0, g: 139, b: 139 },   // Moroccan Teal
      { r: 59, g: 130, b: 246 },  // Bright Blue
      { r: 245, g: 158, b: 11 },  // Gold
    ];

    const blobs = colors.map((color, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 200 + Math.random() * 300,
      color,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      phase: i * (Math.PI * 2) / colors.length,
    }));

    let time = 0;

    function render() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      // Dark mode adaptive base
      const isDark = document.documentElement.classList.contains("dark");
      ctx.fillStyle = isDark ? "hsl(222 15% 8%)" : "hsl(222 33% 97%)";
      ctx.fillRect(0, 0, width, height);

      time += 0.005;

      blobs.forEach((blob) => {
        // Organic movement with sine waves
        blob.x += Math.sin(time + blob.phase) * 0.5;
        blob.y += Math.cos(time + blob.phase * 1.3) * 0.5;
        blob.radius += Math.sin(time * 2 + blob.phase) * 0.2;

        // Wrap around
        if (blob.x < -blob.radius) blob.x = width + blob.radius;
        if (blob.x > width + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = height + blob.radius;
        if (blob.y > height + blob.radius) blob.y = -blob.radius;

        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius
        );

        const opacity = opacityMap[intensity] * (0.6 + Math.sin(time + blob.phase) * 0.2);
        gradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, ${opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      });

      // Subtle noise overlay for texture
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 3;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
      ctx.putImageData(imageData, 0, 0);

      animationRef.current = requestAnimationFrame(render);
    }

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [intensity]);

  return (
    <div className="relative min-h-screen">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full -z-10"
        style={{ pointerEvents: "none" }}
      />
      {children}
    </div>
  );
}
