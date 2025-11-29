import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Wrench, Hammer, Paintbrush, Zap, Settings, Ruler } from 'lucide-react';

interface Tool {
  id: number;
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
  icon: any;
  color: string;
  initialX: number;
  initialY: number;
}

interface FloatingTools3DProps {
  compact?: boolean;
}

export function FloatingTools3D({ compact = false }: FloatingTools3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const toolIcons = compact ? [
    { icon: Wrench, color: '#3b82f6', size: 80 },
    { icon: Hammer, color: '#f59e0b', size: 70 },
    { icon: Paintbrush, color: '#ec4899', size: 65 },
    { icon: Zap, color: '#eab308', size: 75 },
  ] : [
    { icon: Wrench, color: '#3b82f6', size: 120 },
    { icon: Hammer, color: '#f59e0b', size: 100 },
    { icon: Paintbrush, color: '#ec4899', size: 90 },
    { icon: Zap, color: '#eab308', size: 110 },
    { icon: Settings, color: '#8b5cf6', size: 95 },
    { icon: Ruler, color: '#06b6d4', size: 105 },
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize tools with random positions
    const initialTools: Tool[] = toolIcons.map((tool, i) => {
      const angle = (i / toolIcons.length) * Math.PI * 2;
      const radius = compact ? 120 : 200;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      return {
        id: i,
        x,
        y,
        z: Math.random() * 200 - 100,
        rotateX: Math.random() * 360,
        rotateY: Math.random() * 360,
        rotateZ: Math.random() * 360,
        scale: 1,
        icon: tool.icon,
        color: tool.color,
        initialX: x,
        initialY: y,
      };
    });

    setTools(initialTools);

    // Continuous rotation animation
    const animate = () => {
      setTools((prevTools) =>
        prevTools.map((tool) => ({
          ...tool,
          rotateY: tool.rotateY + 0.5,
          rotateX: tool.rotateX + 0.3,
        }))
      );
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    mouseX.set(x);
    mouseY.set(y);

    // Update tools based on mouse position
    setTools((prevTools) =>
      prevTools.map((tool) => {
        const dx = x - tool.initialX;
        const dy = y - tool.initialY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 300;

        if (distance < maxDistance) {
          const force = 1 - distance / maxDistance;
          return {
            ...tool,
            x: tool.initialX - dx * force * 0.3,
            y: tool.initialY - dy * force * 0.3,
            scale: 1 + force * 0.2,
          };
        }

        return {
          ...tool,
          x: tool.initialX,
          y: tool.initialY,
          scale: 1,
        };
      })
    );
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);

    setTools((prevTools) =>
      prevTools.map((tool) => ({
        ...tool,
        x: tool.initialX,
        y: tool.initialY,
        scale: 1,
      }))
    );
  };

  const containerHeight = compact ? 'h-full' : 'h-[600px]';

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${containerHeight} flex items-center justify-center perspective-[1200px]`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1200px' }}
    >
      {/* Central Glow */}
      {!compact && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-96 h-96 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl" />
        </motion.div>
      )}

      {/* Floating Tools */}
      {tools.map((tool, index) => (
        <motion.div
          key={tool.id}
          className="absolute"
          style={{
            transformStyle: 'preserve-3d',
            transform: `translate3d(${tool.x}px, ${tool.y}px, ${tool.z}px)
                       rotateX(${tool.rotateX}deg)
                       rotateY(${tool.rotateY}deg)
                       rotateZ(${tool.rotateZ}deg)
                       scale(${tool.scale})`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: tool.scale }}
          transition={{ delay: index * 0.1, duration: 0.6 }}
        >
          <motion.div
            className={`relative ${compact ? 'p-4' : 'p-8'} rounded-3xl glass-enhanced shadow-2xl`}
            style={{
              background: `linear-gradient(135deg, ${tool.color}20, ${tool.color}10)`,
              borderColor: `${tool.color}40`,
            }}
            whileHover={{ scale: 1.2 }}
          >
            <tool.icon
              className={compact ? "w-12 h-12" : "w-20 h-20"}
              style={{ color: tool.color }}
              strokeWidth={1.5}
            />

            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-3xl blur-xl opacity-50"
              style={{
                background: tool.color,
                transform: 'translateZ(-50px)',
              }}
            />
          </motion.div>
        </motion.div>
      ))}

      {/* Center Text - Only show in non-compact mode */}
      {!compact && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="text-center space-y-4">
            <motion.div
              className="text-8xl font-bold gradient-text-animated"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              AlloBricolage
            </motion.div>
            <motion.p
              className="text-2xl text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              Vos experts en maintenance
            </motion.p>
          </div>
        </motion.div>
      )}

      {/* Interactive cursor follower */}
      <motion.div
        className="absolute w-32 h-32 rounded-full border-2 border-primary/30 pointer-events-none"
        style={{
          x: smoothMouseX,
          y: smoothMouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
      />
    </div>
  );
}
