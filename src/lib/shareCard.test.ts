import { describe, expect, it } from 'vitest';
import { wrapLines } from './shareCard';

const measure = (s: string) => s.length * 10;

describe('wrapLines', () => {
  it('membungkus per kata', () => {
    expect(wrapLines('aaa bbb ccc ddd', 70, measure)).toEqual(['aaa bbb', 'ccc ddd']);
  });
  it('menjaga baris kosong antar paragraf', () => {
    expect(wrapLines('a\n\nb', 100, measure)).toEqual(['a', '', 'b']);
  });
  it('memecah kata yang terlalu panjang', () => {
    const lines = wrapLines('a'.repeat(25), 100, measure);
    expect(lines.every((l) => l.length <= 10)).toBe(true);
    expect(lines.join('')).toBe('a'.repeat(25));
  });
});
