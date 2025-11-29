import { useEffect, useState } from 'react';
import { generateStarPattern } from '@/lib/generative/zellij-algorithm';
import { NEO_ANDALUSIAN_PALETTE } from './GenerativeBackground';

interface ZellijLoaderProps {
  size?: number;
  text?: string;
}

export function ZellijLoader({ size = 120, text = 'Chargement...' }: ZellijLoaderProps) {
  const [shards, setShards] = useState<Array<{x: number; y: number; delay: number}>>([]);

  useEffect(() => {
    const centerX = size / 2;
    const centerY = size / 2;
    const vertices = generateStarPattern(centerX, centerY, 8, size * 0.4, size * 0.2);

    const shardsData = vertices.map((v, i) => ({
      x: v.x,
      y: v.y,
      delay: i * 0.1
    }));

    setShards(shardsData);
  }, [size]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative"
      >
        <defs>
          <linearGradient id="zellijGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={NEO_ANDALUSIAN_PALETTE.electricMajorelle} />
            <stop offset="100%" stopColor={NEO_ANDALUSIAN_PALETTE.gold} />
          </linearGradient>
        </defs>

        {shards.map((shard, i) => {
          const nextShard = shards[(i + 1) % shards.length];
          const centerX = size / 2;
          const centerY = size / 2;

          return (
            <path
              key={i}
              d={`M ${centerX} ${centerY} L ${shard.x} ${shard.y} L ${nextShard.x} ${nextShard.y} Z`}
              fill="url(#zellijGradient)"
              stroke={NEO_ANDALUSIAN_PALETTE.gold}
              strokeWidth="1"
              opacity="0.8"
              style={{
                animation: `zellij-shard 2s ease-in-out infinite`,
                animationDelay: `${shard.delay}s`,
                transformOrigin: 'center',
                transform: 'scale(1)'
              }}
            />
          );
        })}

        <circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.08}
          fill={NEO_ANDALUSIAN_PALETTE.terracottaPulse}
          style={{
            animation: 'zellij-pulse 1.5s ease-in-out infinite'
          }}
        />
      </svg>

      {text && (
        <p className="text-sm font-medium" style={{ color: NEO_ANDALUSIAN_PALETTE.sandstone }}>
          {text}
        </p>
      )}

      <style>{`
        @keyframes zellij-shard {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
            opacity: 1;
          }
        }

        @keyframes zellij-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
