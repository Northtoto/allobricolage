import { useEffect, useRef, useState } from 'react';
import { generateZellijPattern, interpolateVertices } from '@/lib/generative/zellij-algorithm';

export const NEO_ANDALUSIAN_PALETTE = {
  midnightAtlas: '#0A1128',
  electricMajorelle: '#0055FF',
  terracottaPulse: '#E05A47',
  sandstone: '#F2E2D9',
  gold: '#D4AF37'
};

interface GenerativeBackgroundProps {
  activeBookings?: number;
  clientId?: string;
  className?: string;
}

export function GenerativeBackground({
  activeBookings = 0,
  clientId = 'default',
  className = ''
}: GenerativeBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLowEnd, setIsLowEnd] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    if (navigator.hardwareConcurrency < 4) {
      setIsLowEnd(true);
      return;
    }

    const complexity = activeBookings < 10 ? 8 : 12;
    const baseColor = activeBookings < 10
      ? NEO_ANDALUSIAN_PALETTE.electricMajorelle
      : NEO_ANDALUSIAN_PALETTE.terracottaPulse;

    const pattern1 = generateZellijPattern(clientId, complexity, width, height);
    const pattern2 = generateZellijPattern(clientId + '-alt', complexity, width, height);

    let time = 0;
    const animate = () => {
      time += 0.005;
      const progress = (Math.sin(time) + 1) / 2;

      ctx.fillStyle = NEO_ANDALUSIAN_PALETTE.midnightAtlas;
      ctx.fillRect(0, 0, width, height);

      const currentVertices = interpolateVertices(
        pattern1.vertices,
        pattern2.vertices,
        progress
      );

      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;

      ctx.beginPath();
      currentVertices.forEach((v, i) => {
        if (i === 0) {
          ctx.moveTo(v.x, v.y);
        } else {
          ctx.lineTo(v.x, v.y);
        }
      });
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = NEO_ANDALUSIAN_PALETTE.gold;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;

      for (let i = 0; i < currentVertices.length; i++) {
        const v1 = currentVertices[i];
        const v2 = currentVertices[(i + 4) % currentVertices.length];
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeBookings, clientId]);

  if (isLowEnd) {
    return (
      <div className={`neo-andalusian-bg ${className}`} style={{
        background: `linear-gradient(135deg, ${NEO_ANDALUSIAN_PALETTE.midnightAtlas} 0%, ${NEO_ANDALUSIAN_PALETTE.electricMajorelle} 100%)`
      }} />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`neo-andalusian-bg ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0
      }}
    />
  );
}
