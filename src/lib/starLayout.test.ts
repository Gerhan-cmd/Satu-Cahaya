import { describe, expect, it } from 'vitest';
import { messageStarPosition } from './starLayout';

describe('messageStarPosition', () => {
  it('deterministik untuk ID yang sama', () => {
    expect(messageStarPosition('abc')).toEqual(messageStarPosition('abc'));
  });
  it('berbeda untuk ID berbeda', () => {
    expect(messageStarPosition('abc')).not.toEqual(messageStarPosition('abd'));
  });
  it('selalu di dalam batas layar', () => {
    for (let i = 0; i < 200; i++) {
      const p = messageStarPosition(`id-${i}`);
      expect(p.x).toBeGreaterThanOrEqual(0.04);
      expect(p.x).toBeLessThanOrEqual(0.96);
      expect(p.y).toBeGreaterThanOrEqual(0.07);
      expect(p.y).toBeLessThanOrEqual(0.93);
    }
  });
});
