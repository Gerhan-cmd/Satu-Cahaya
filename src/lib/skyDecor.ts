import { hashString, mulberry32 } from './prng';

export type DecorStar = { wx: number; wy: number; r: number; a: number; glow: boolean };
export type DecorLine = { x1: number; y1: number; x2: number; y2: number };
export type SkyDecor = { stars: DecorStar[]; lines: DecorLine[] };

/** Ukuran ubin dunia untuk rasi latar. Beberapa rasi terlihat sekaligus di viewport biasa. */
export const SKY_TILE = 720;

/** Bentuk rasi (koordinat lokal sekitar 0..1), cukup dikenali tanpa meniru peta bintang sungguhan. */
const SHAPES: Array<{ pts: Array<[number, number]>; edges: Array<[number, number]> }> = [
  // Gayung
  {
    pts: [
      [0.08, 0.42],
      [0.28, 0.38],
      [0.48, 0.44],
      [0.66, 0.36],
      [0.78, 0.12],
      [0.96, 0.22],
      [0.88, 0.02],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [3, 6],
    ],
  },
  // W
  {
    pts: [
      [0.05, 0.18],
      [0.28, 0.55],
      [0.5, 0.22],
      [0.72, 0.58],
      [0.95, 0.2],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  // Salib
  {
    pts: [
      [0.5, 0.02],
      [0.5, 0.38],
      [0.5, 0.78],
      [0.18, 0.4],
      [0.82, 0.42],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [3, 1],
      [1, 4],
    ],
  },
  // Belah ketupat
  {
    pts: [
      [0.5, 0.05],
      [0.92, 0.48],
      [0.5, 0.92],
      [0.08, 0.5],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
  },
  // Busur
  {
    pts: [
      [0.05, 0.7],
      [0.22, 0.38],
      [0.5, 0.18],
      [0.78, 0.36],
      [0.95, 0.68],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  // Rantai
  {
    pts: [
      [0.06, 0.55],
      [0.24, 0.28],
      [0.44, 0.48],
      [0.64, 0.22],
      [0.82, 0.5],
      [0.96, 0.3],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  },
  // Segitiga + ekor
  {
    pts: [
      [0.22, 0.22],
      [0.78, 0.18],
      [0.48, 0.62],
      [0.4, 0.88],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
    ],
  },
  // Rumah
  {
    pts: [
      [0.18, 0.92],
      [0.18, 0.48],
      [0.5, 0.12],
      [0.82, 0.48],
      [0.82, 0.92],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
  },
];

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}

/** Satu ubin langit: debu bintang + kadang sebuah rasi. Deterministik dari koordinat ubin. */
export function skyTile(tx: number, ty: number, tile = SKY_TILE, sparse = false): SkyDecor {
  const rnd = mulberry32(hashString(`rasi:${tx}:${ty}`));
  const originX = tx * tile;
  const originY = ty * tile;
  const pad = 28;
  const stars: DecorStar[] = [];
  const field = sparse ? 14 : 26;
  const n = field + Math.floor(rnd() * (sparse ? 8 : 12));
  for (let i = 0; i < n; i++) {
    stars.push({
      wx: originX + pad + rnd() * (tile - pad * 2),
      wy: originY + pad + rnd() * (tile - pad * 2),
      r: 0.45 + rnd() * 1.05,
      a: 0.12 + rnd() * 0.28,
      glow: false,
    });
  }

  const lines: DecorLine[] = [];
  if (rnd() < (sparse ? 0.42 : 0.62)) {
    const shape = SHAPES[Math.floor(rnd() * SHAPES.length)]!;
    const scale = tile * (0.34 + rnd() * 0.28);
    const rot = rnd() * Math.PI * 2;
    const cx = originX + tile * (0.28 + rnd() * 0.44);
    const cy = originY + tile * (0.28 + rnd() * 0.44);
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const pts = shape.pts.map(([x, y]) => {
      const lx = (x - 0.5) * scale;
      const ly = (y - 0.5) * scale;
      return {
        wx: cx + lx * cos - ly * sin,
        wy: cy + lx * sin + ly * cos,
        r: 1.15 + rnd() * 0.85,
        a: 0.38 + rnd() * 0.22,
        glow: true,
      };
    });
    stars.push(...pts);
    for (const [i, j] of shape.edges) {
      const a = pts[i]!;
      const b = pts[j]!;
      lines.push({ x1: a.wx, y1: a.wy, x2: b.wx, y2: b.wy });
    }
  }

  return { stars, lines };
}

/** Gabungkan ubin yang menyentuh viewport kamera. */
export function visibleSkyDecor(
  cam: { x: number; y: number },
  view: { w: number; h: number },
  world: { w: number; h: number },
  sparse = false,
  tile = SKY_TILE,
): SkyDecor {
  const x0 = Math.max(0, Math.floor(cam.x / tile) - 1);
  const y0 = Math.max(0, Math.floor(cam.y / tile) - 1);
  const x1 = Math.min(Math.floor((world.w - 1) / tile), Math.floor((cam.x + view.w) / tile) + 1);
  const y1 = Math.min(Math.floor((world.h - 1) / tile), Math.floor((cam.y + view.h) / tile) + 1);
  const stars: DecorStar[] = [];
  const lines: DecorLine[] = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const part = skyTile(tx, ty, tile, sparse);
      for (const s of part.stars) {
        if (s.wx < 0 || s.wy < 0 || s.wx > world.w || s.wy > world.h) continue;
        stars.push(s);
      }
      for (const ln of part.lines) {
        if (
          Math.max(ln.x1, ln.x2) < cam.x - 80 ||
          Math.min(ln.x1, ln.x2) > cam.x + view.w + 80 ||
          Math.max(ln.y1, ln.y2) < cam.y - 80 ||
          Math.min(ln.y1, ln.y2) > cam.y + view.h + 80
        ) {
          continue;
        }
        lines.push(ln);
      }
    }
  }
  return { stars, lines };
}

export function tileIndex(v: number, tile = SKY_TILE): number {
  return Math.floor(clamp(v, 0, Number.MAX_SAFE_INTEGER) / tile);
}
