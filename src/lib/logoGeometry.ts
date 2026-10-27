// Geometri logo (desain nomor 2): bintang di puncak kubah, berkas cahaya, sosok di bukit, jejak titik.
// Murni data/fungsi (sintaks yang bisa di-strip) agar dipakai komponen Intro dan skrip pembuat logo statis.

export const STAR = { x: 200, y: 104, outer: 28, inner: 12 };
export const RAY_ORIGIN = { x: 200, y: 130 };

export function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

export const STAR_PATH = starPath(STAR.x, STAR.y, STAR.outer, STAR.inner);

/** Kubah (batas atas melengkung, dasar mengikuti bukit). */
export const DOME = 'M60 330 C60 205 118 120 200 120 C282 120 340 205 340 330 Q200 290 60 330 Z';
export const HILL = 'M60 330 Q200 290 340 330';

function polar(angleDeg: number, r: number): string {
  const t = (angleDeg * Math.PI) / 180;
  return `${(RAY_ORIGIN.x + r * Math.sin(t)).toFixed(2)} ${(RAY_ORIGIN.y + r * Math.cos(t)).toFixed(2)}`;
}

export function rayPath(a1: number, a2: number, r0 = 20, r1 = 250): string {
  return `M${polar(a1, r0)} L${polar(a1, r1)} L${polar(a2, r1)} L${polar(a2, r0)} Z`;
}

const BANDS: Array<[number, number]> = [[11, 21], [28, 41], [48, 63]];

/** Berkas cahaya; rank 0 = tengah, makin besar makin ke tepi (untuk urutan animasi). */
export const RAYS: Array<{ path: string; rank: number }> = [
  { path: rayPath(-4.5, 4.5), rank: 0 },
  ...BANDS.flatMap(([a, b], i) => [
    { path: rayPath(a, b), rank: i + 1 },
    { path: rayPath(-b, -a), rank: i + 1 },
  ]),
];

export const FIGURE_HEAD = { cx: 200, cy: 277, r: 5.5 };
export const FIGURE_BODY =
  'M194 287 a2 2 0 0 1 2 -2 h8 a2 2 0 0 1 2 2 v13 h-2.8 v10 h-2.6 v-9 h-1.2 v9 h-2.6 v-10 h-2.8 z';

/** Jejak langkah menuju sosok. */
export const DOTS: Array<{ cx: number; cy: number; r: number }> = [
  { cx: 104, cy: 362, r: 3 },
  { cx: 132, cy: 357, r: 3.4 },
  { cx: 158, cy: 351, r: 3.8 },
  { cx: 180, cy: 344, r: 4.2 },
  { cx: 198, cy: 336, r: 4.6 },
];
