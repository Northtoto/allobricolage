export interface ZellijPattern {
  vertices: Array<{x: number; y: number}>;
  complexity: number;
  seed: string;
}

export function generateZellijPattern(
  seed: string,
  complexity: number = 8,
  width: number = 800,
  height: number = 600
): ZellijPattern {
  const random = seededRandom(seed);
  const vertices: Array<{x: number; y: number}> = [];

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;
  const points = complexity * 2;

  for (let i = 0; i < points; i++) {
    const angle = (Math.PI * 2 * i) / points;
    const r = radius * (0.7 + random() * 0.3);
    vertices.push({
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    });
  }

  return { vertices, complexity, seed };
}

export function generateStarPattern(
  centerX: number,
  centerY: number,
  points: number,
  outerRadius: number,
  innerRadius: number
): Array<{x: number; y: number}> {
  const vertices: Array<{x: number; y: number}> = [];
  const angleStep = Math.PI / points;

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * angleStep - Math.PI / 2;
    vertices.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    });
  }

  return vertices;
}

export function generateKhatamGrid(
  width: number,
  height: number,
  tileSize: number = 50
): Array<{x: number; y: number; rotation: number}> {
  const tiles: Array<{x: number; y: number; rotation: number}> = [];

  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const rotation = ((x + y) / tileSize) * 36;
      tiles.push({ x, y, rotation });
    }
  }

  return tiles;
}

function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }

  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

export function interpolateVertices(
  v1: Array<{x: number; y: number}>,
  v2: Array<{x: number; y: number}>,
  progress: number
): Array<{x: number; y: number}> {
  const length = Math.min(v1.length, v2.length);
  return Array.from({ length }, (_, i) => ({
    x: v1[i].x + (v2[i].x - v1[i].x) * progress,
    y: v1[i].y + (v2[i].y - v1[i].y) * progress
  }));
}
