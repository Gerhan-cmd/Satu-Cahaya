import { describe, expect, it } from 'vitest';
import { CURATED_MESSAGES } from './curated';
import { DEMO_MESSAGES } from './demoMessages';
import { layoutStars } from './starLayout';
import { WORLD } from './camera';
import { validateBody } from './validation';

describe.each([
  ['demo', DEMO_MESSAGES, 62],
  ['kurasi', CURATED_MESSAGES, 6],
])('konten %s', (_name, list, count) => {
  it(`berjumlah ${count} dengan ID unik`, () => {
    expect(list).toHaveLength(count);
    expect(new Set(list.map((m) => m.id)).size).toBe(count);
  });
  it('semua pesan lolos aturan validasi yang sama dengan pesan pengunjung', () => {
    for (const m of list) expect(validateBody(m.body), m.id).toMatchObject({ ok: true, body: m.body });
  });
  it('asal dan label sesuai', () => {
    for (const m of list) expect(m.origin).toBe(_name === 'demo' ? 'sample' : 'curated');
  });
});

describe('tata letak bintang di dunia', () => {
  const minGap = (ids: string[]) => {
    const pts = layoutStars(ids, WORLD);
    let min = Infinity;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) min = Math.min(min, Math.hypot(pts[i].wx - pts[j].wx, pts[i].wy - pts[j].wy));
    return min;
  };
  it('bintang demo tidak menumpuk', () => {
    expect(minGap(DEMO_MESSAGES.map((m) => m.id))).toBeGreaterThanOrEqual(44);
  });
  it('tetap renggang untuk 300 bintang', () => {
    expect(minGap(Array.from({ length: 300 }, (_, i) => `uuid-${i}-${i * 7919}`))).toBeGreaterThanOrEqual(44);
  });
  it('deterministik dan tidak bergantung urutan input', () => {
    const ids = DEMO_MESSAGES.map((m) => m.id);
    expect(layoutStars(ids, WORLD)).toEqual(layoutStars([...ids].reverse(), WORLD));
  });
  it('bintang yang tidak bertabrakan tidak berpindah saat bintang baru ditambahkan', () => {
    const ids = DEMO_MESSAGES.map((m) => m.id);
    const before = new Map(layoutStars(ids, WORLD).map((p) => [p.id, p]));
    const after = layoutStars([...ids, 'pesan-baru-xyz'], WORLD);
    const moved = after.filter((p) => p.id !== 'pesan-baru-xyz' && (before.get(p.id)!.wx !== p.wx || before.get(p.id)!.wy !== p.wy));
    expect(moved.length).toBeLessThanOrEqual(2);
  });
  it('semua di dalam dunia', () => {
    for (const p of layoutStars(DEMO_MESSAGES.map((m) => m.id), WORLD)) {
      expect(p.wx).toBeGreaterThan(0);
      expect(p.wx).toBeLessThan(WORLD.w);
      expect(p.wy).toBeGreaterThan(0);
      expect(p.wy).toBeLessThan(WORLD.h);
    }
  });
});
