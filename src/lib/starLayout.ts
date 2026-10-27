import { hashString, mulberry32 } from './prng';

export type StarPosition = { x: number; y: number; size: number; phase: number };

/** Posisi bintang pesan di dunia (0..1), deterministik dari ID: tidak melompat antar render. */
export function messageStarPosition(id: string): StarPosition {
  const rnd = mulberry32(hashString(id));
  return {
    x: 0.04 + rnd() * 0.92,
    y: 0.07 + rnd() * 0.86,
    size: 2.2 + rnd() * 1.6,
    phase: rnd() * Math.PI * 2,
  };
}

export type PlacedStar = { id: string; wx: number; wy: number; size: number; phase: number };

/**
 * Tata letak bintang di dunia dengan jarak minimum agar mudah diketuk.
 * Deterministik: ID diurut, posisi awal dari hash ID, dan hanya bintang yang bertabrakan
 * yang digeser (undian ulang dari PRNG yang sama). Bintang lain tidak berubah posisi.
 */
export function layoutStars(
  ids: readonly string[],
  world: { w: number; h: number },
  minDist = 44,
  tries = 12,
): PlacedStar[] {
  const placed: PlacedStar[] = [];
  const farEnough = (x: number, y: number) => placed.every((p) => Math.hypot(p.wx - x, p.wy - y) >= minDist);
  for (const id of [...ids].sort()) {
    const rnd = mulberry32(hashString(id));
    const draw = () => ({ x: (0.04 + rnd() * 0.92) * world.w, y: (0.07 + rnd() * 0.86) * world.h });
    let { x, y } = draw();
    const size = 2.2 + rnd() * 1.6;
    const phase = rnd() * Math.PI * 2;
    for (let i = 0; i < tries && !farEnough(x, y); i++) ({ x, y } = draw());
    placed.push({ id, wx: x, wy: y, size, phase });
  }
  return placed;
}
