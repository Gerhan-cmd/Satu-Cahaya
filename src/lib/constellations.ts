/**
 * Rasi bintang dekoratif (tidak bisa diklik). Bentuknya disederhanakan/bergaya, bukan peta astronomi presisi.
 * Titik berada di kotak 0..100 (y ke bawah); `lines` adalah rangkaian indeks titik yang dihubungkan.
 * `anchor` = pusat (0..1) pada lapisan rasi; `size` = lebar kotak dalam px.
 */
export type Constellation = {
  name: string;
  kind: 'zodiak' | 'lain';
  points: Array<[number, number]>;
  lines: number[][];
  anchor: [number, number];
  size: number;
};

export const CONSTELLATIONS: Constellation[] = [
  { name: 'Aries', kind: 'zodiak', anchor: [0.1, 0.17], size: 160,
    points: [[84, 22], [70, 40], [56, 46], [46, 52]], lines: [[0, 1, 2, 3]] },
  { name: 'Taurus', kind: 'zodiak', anchor: [0.3, 0.1], size: 200,
    points: [[14, 40], [30, 50], [46, 60], [60, 46], [74, 34], [90, 16], [30, 16], [34, 12], [37, 17], [32, 20], [40, 13]],
    lines: [[0, 1, 2, 3, 4, 5]] },
  { name: 'Gemini', kind: 'zodiak', anchor: [0.52, 0.18], size: 190,
    points: [[30, 12], [32, 34], [28, 56], [22, 78], [46, 14], [48, 36], [54, 58], [62, 80]],
    lines: [[0, 1, 2, 3], [4, 5, 6, 7], [1, 5]] },
  { name: 'Orion', kind: 'lain', anchor: [0.72, 0.12], size: 240,
    points: [[30, 18], [70, 16], [40, 50], [50, 48], [60, 46], [32, 84], [68, 82], [50, 8]],
    lines: [[7, 0], [7, 1], [0, 2], [1, 4], [2, 3, 4], [2, 5], [4, 6]] },
  { name: 'Kasiopea', kind: 'lain', anchor: [0.91, 0.2], size: 170,
    points: [[8, 40], [28, 66], [50, 38], [72, 64], [94, 30]], lines: [[0, 1, 2, 3, 4]] },
  { name: 'Cancer', kind: 'zodiak', anchor: [0.08, 0.42], size: 150,
    points: [[50, 52], [34, 26], [68, 28], [28, 84], [74, 80]], lines: [[1, 0], [2, 0], [0, 3], [0, 4]] },
  { name: 'Leo', kind: 'zodiak', anchor: [0.27, 0.38], size: 230,
    points: [[20, 74], [26, 58], [34, 42], [30, 24], [42, 14], [50, 26], [70, 40], [66, 60], [92, 50]],
    lines: [[0, 1, 2, 3, 4, 5], [2, 6, 8, 7, 2], [0, 7]] },
  { name: 'Biduk', kind: 'lain', anchor: [0.5, 0.45], size: 220,
    points: [[16, 32], [46, 36], [42, 56], [20, 52], [62, 30], [78, 24], [94, 34]],
    lines: [[0, 1, 2, 3, 0], [1, 4, 5, 6]] },
  { name: 'Virgo', kind: 'zodiak', anchor: [0.72, 0.4], size: 220,
    points: [[40, 88], [46, 66], [54, 48], [72, 36], [88, 28], [36, 34], [20, 24], [74, 60]],
    lines: [[0, 1, 2, 3, 4], [2, 5, 6], [2, 7]] },
  { name: 'Libra', kind: 'zodiak', anchor: [0.92, 0.5], size: 160,
    points: [[24, 64], [50, 18], [80, 40], [56, 60], [70, 88]], lines: [[0, 1, 2, 3, 0], [3, 4]] },
  { name: 'Scorpio', kind: 'zodiak', anchor: [0.1, 0.68], size: 230,
    points: [[22, 14], [30, 22], [38, 32], [46, 40], [56, 48], [60, 60], [58, 72], [66, 82], [78, 84], [86, 76], [84, 66], [30, 40]],
    lines: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [2, 11]] },
  { name: 'Sagitarius', kind: 'zodiak', anchor: [0.32, 0.7], size: 220,
    points: [[18, 50], [32, 30], [52, 24], [68, 34], [64, 58], [42, 66], [46, 44], [86, 24]],
    lines: [[0, 1, 2, 3, 4, 5, 0], [1, 6, 4], [3, 7]] },
  { name: 'Salib Selatan', kind: 'lain', anchor: [0.52, 0.72], size: 170,
    points: [[50, 8], [50, 90], [26, 40], [74, 56], [38, 62]], lines: [[0, 1], [2, 3]] },
  { name: 'Capricornus', kind: 'zodiak', anchor: [0.72, 0.68], size: 190,
    points: [[12, 26], [30, 52], [54, 70], [78, 58], [90, 30], [52, 28]], lines: [[0, 1, 2, 3, 4, 5, 0]] },
  { name: 'Aquarius', kind: 'zodiak', anchor: [0.9, 0.78], size: 200,
    points: [[12, 30], [28, 20], [42, 36], [58, 26], [72, 42], [88, 32], [48, 58], [40, 78], [62, 80]],
    lines: [[0, 1, 2, 3, 4, 5], [2, 6, 7, 8, 6]] },
  { name: 'Pisces', kind: 'zodiak', anchor: [0.2, 0.9], size: 190,
    points: [[14, 30], [24, 22], [34, 32], [24, 40], [46, 48], [56, 64], [70, 50], [80, 38], [88, 28], [96, 36], [88, 46]],
    lines: [[0, 1, 2, 3, 0], [2, 4, 5, 6, 7], [7, 8, 9, 10, 7]] },
];

/** Parallax lapisan rasi: lebih lambat dari bintang pesan (1) agar terasa jauh. */
export const CONSTELLATION_PARALLAX = 0.35;

export type PlacedConstellation = { c: Constellation; x: number; y: number; size: number };

/** Posisi kiri-atas tiap rasi pada lapisan berukuran lw × lh. */
export function placeConstellations(lw: number, lh: number): PlacedConstellation[] {
  return CONSTELLATIONS.map((c) => ({
    c,
    size: c.size,
    x: c.anchor[0] * lw - c.size / 2,
    y: c.anchor[1] * lh - c.size / 2,
  }));
}

/** Ukuran lapisan rasi agar seluruh pergeseran kamera tetap tertutup. */
export function constellationLayerSize(view: { w: number; h: number }, world: { w: number; h: number }) {
  const f = CONSTELLATION_PARALLAX;
  return { w: view.w + Math.max(0, world.w - view.w) * f, h: view.h + Math.max(0, world.h - view.h) * f };
}
