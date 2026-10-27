import { describe, expect, it, vi } from 'vitest';
import { markIntroSeen, shouldShowIntro } from './intro';

describe('intro per sesi', () => {
  it('tampil bila belum pernah dilihat, tidak lagi setelah ditandai', () => {
    sessionStorage.clear();
    expect(shouldShowIntro()).toBe(true);
    markIntroSeen();
    expect(shouldShowIntro()).toBe(false);
  });
  it('storage diblokir: tetap tampil dan tidak melempar error', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(shouldShowIntro()).toBe(true);
    expect(() => markIntroSeen()).not.toThrow();
    get.mockRestore();
    set.mockRestore();
  });
});
