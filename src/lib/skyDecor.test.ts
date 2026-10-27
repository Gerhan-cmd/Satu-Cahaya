import { describe, expect, it } from 'vitest';
import { SKY_TILE, skyTile, visibleSkyDecor } from './skyDecor';

describe('skyTile', () => {
  it('deterministik untuk ubin yang sama', () => {
    expect(skyTile(3, 5)).toEqual(skyTile(3, 5));
  });
  it('berbeda antar ubin', () => {
    expect(skyTile(3, 5)).not.toEqual(skyTile(3, 6));
  });
  it('bintang debu berada di dalam ubin', () => {
    const { stars } = skyTile(2, 1);
    const dust = stars.filter((s) => !s.glow);
    expect(dust.length).toBeGreaterThan(10);
    for (const s of dust) {
      expect(s.wx).toBeGreaterThanOrEqual(2 * SKY_TILE);
      expect(s.wx).toBeLessThan((2 + 1) * SKY_TILE);
      expect(s.wy).toBeGreaterThanOrEqual(1 * SKY_TILE);
      expect(s.wy).toBeLessThan((1 + 1) * SKY_TILE);
    }
  });
});

describe('visibleSkyDecor', () => {
  const world = { w: 4000, h: 3000 };
  it('hanya mengambil ubin di sekitar kamera', () => {
    const a = visibleSkyDecor({ x: 100, y: 80 }, { w: 400, h: 300 }, world);
    const b = visibleSkyDecor({ x: 3200, y: 2400 }, { w: 400, h: 300 }, world);
    expect(a.stars.length).toBeGreaterThan(0);
    expect(b.stars.length).toBeGreaterThan(0);
    expect(a.stars.some((s) => b.stars.some((t) => t.wx === s.wx && t.wy === s.wy))).toBe(false);
  });
  it('titik tetap di dalam dunia', () => {
    const { stars } = visibleSkyDecor({ x: 0, y: 0 }, { w: 800, h: 600 }, world);
    for (const s of stars) {
      expect(s.wx).toBeGreaterThanOrEqual(0);
      expect(s.wx).toBeLessThanOrEqual(world.w);
      expect(s.wy).toBeGreaterThanOrEqual(0);
      expect(s.wy).toBeLessThanOrEqual(world.h);
    }
  });
});
