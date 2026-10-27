import { describe, expect, it } from 'vitest';
import { WORLD } from './camera';
import { CONSTELLATIONS, constellationLayerSize, placeConstellations } from './constellations';

describe('data rasi bintang', () => {
  it('memuat 12 zodiak dan rasi lain, nama unik', () => {
    expect(CONSTELLATIONS.filter((c) => c.kind === 'zodiak')).toHaveLength(12);
    expect(new Set(CONSTELLATIONS.map((c) => c.name)).size).toBe(CONSTELLATIONS.length);
  });
  it('semua indeks garis valid dan titik di dalam kotak 0..100', () => {
    for (const c of CONSTELLATIONS) {
      for (const [x, y] of c.points) {
        expect(x, c.name).toBeGreaterThanOrEqual(0);
        expect(x, c.name).toBeLessThanOrEqual(100);
        expect(y, c.name).toBeGreaterThanOrEqual(0);
        expect(y, c.name).toBeLessThanOrEqual(100);
      }
      for (const line of c.lines) for (const i of line) expect(i, c.name).toBeLessThan(c.points.length);
      expect(c.anchor[0]).toBeGreaterThan(0);
      expect(c.anchor[0]).toBeLessThan(1);
    }
  });
  it.each([
    [360, 740],
    [390, 844],
    [768, 1024],
    [1440, 900],
    [1920, 1080],
  ])('tidak saling menumpuk pada viewport %i×%i', (w, h) => {
    const { w: lw, h: lh } = constellationLayerSize({ w, h }, WORLD);
    const p = placeConstellations(lw, lh);
    for (let i = 0; i < p.length; i++)
      for (let j = i + 1; j < p.length; j++) {
        const a = p[i];
        const b = p[j];
        const overlapX = Math.abs(a.x + a.size / 2 - (b.x + b.size / 2)) < (a.size + b.size) / 2;
        const overlapY = Math.abs(a.y + a.size / 2 - (b.y + b.size / 2)) < (a.size + b.size) / 2;
        expect(overlapX && overlapY, `${a.c.name} x ${b.c.name}`).toBe(false);
      }
  });
});
