import { describe, expect, it } from 'vitest';
import { DOME, DOTS, HILL, RAYS, STAR_PATH, rayPath, starPath } from './logoGeometry';

describe('geometri logo', () => {
  it('bintang berujung lima: 10 titik, tanpa NaN', () => {
    expect(starPath(0, 0, 10, 4).match(/[ML]/g)).toHaveLength(10);
    expect(STAR_PATH).not.toContain('NaN');
  });
  it('semua path valid dan berkas cahaya simetris', () => {
    for (const d of [DOME, HILL, ...RAYS.map((r) => r.path), rayPath(5, 10)]) expect(d).not.toMatch(/NaN|undefined/);
    expect(RAYS.filter((r) => r.rank === 0)).toHaveLength(1);
    for (const rank of [1, 2, 3]) expect(RAYS.filter((r) => r.rank === rank)).toHaveLength(2);
  });
  it('jejak titik membesar menuju sosok', () => {
    for (let i = 1; i < DOTS.length; i++) expect(DOTS[i].r).toBeGreaterThan(DOTS[i - 1].r);
  });
});
