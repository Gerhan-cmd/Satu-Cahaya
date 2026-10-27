export type Vec = { x: number; y: number };
export type Size = { w: number; h: number };

/** Ukuran "dunia" langit dalam px. Viewport adalah jendela yang bergeser di atasnya. */
export const WORLD: Size = { w: 3200, h: 2000 };

/** Batasi kamera (pojok kiri-atas viewport) agar tetap di dalam dunia; dipusatkan bila viewport lebih besar. */
export function clampCamera(c: Vec, view: Size, world: Size): Vec {
  const axis = (v: number, vs: number, ws: number) => (vs >= ws ? (ws - vs) / 2 : Math.min(Math.max(v, 0), ws - vs));
  return { x: axis(c.x, view.w, world.w), y: axis(c.y, view.h, world.h) };
}

/** Kamera yang menempatkan titik p di tengah viewport (tetap dibatasi dunia). */
export function centerOn(p: Vec, view: Size, world: Size): Vec {
  return clampCamera({ x: p.x - view.w / 2, y: p.y - view.h / 2 }, view, world);
}

/** Modulo yang selalu non-negatif (untuk lapisan parallax yang menyambung). */
export function wrap(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function easeOutCubic(p: number): number {
  const q = 1 - Math.min(Math.max(p, 0), 1);
  return 1 - q * q * q;
}
