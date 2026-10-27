import { describe, expect, it } from 'vitest';
import { CURATED_MESSAGES } from './curated';
import { pickMessage } from './pick';
import { mulberry32 } from './prng';

describe('pickMessage', () => {
  it('tidak pernah mengembalikan ID yang dikecualikan', () => {
    const rnd = mulberry32(1);
    for (let i = 0; i < 200; i++) {
      const m = pickMessage(CURATED_MESSAGES, ['kurasi-01', 'kurasi-02'], rnd);
      expect(['kurasi-01', 'kurasi-02']).not.toContain(m?.id);
    }
  });
  it('null bila tidak ada yang eligible', () => {
    expect(pickMessage([], [])).toBeNull();
    expect(pickMessage(CURATED_MESSAGES, CURATED_MESSAGES.map((m) => m.id))).toBeNull();
  });
  it('menjangkau batas indeks', () => {
    expect(pickMessage(CURATED_MESSAGES, [], () => 0)?.id).toBe('kurasi-01');
    expect(pickMessage(CURATED_MESSAGES, [], () => 0.9999999)?.id).toBe('kurasi-06');
  });
  it('tidak selalu memilih pesan yang sama', () => {
    const rnd = mulberry32(7);
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) seen.add(pickMessage(CURATED_MESSAGES, [], rnd)!.id);
    expect(seen.size).toBe(CURATED_MESSAGES.length);
  });
});
