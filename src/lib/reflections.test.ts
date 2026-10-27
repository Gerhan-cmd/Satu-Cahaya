import { describe, expect, it } from 'vitest';
import { formatExport, parseReflections } from './reflections';

describe('parseReflections', () => {
  it('membuang data rusak', () => {
    expect(parseReflections('x')).toEqual([]);
    expect(parseReflections([{ id: 1 }, null, { id: 'a', prompt: 'p', text: 't', createdAt: '2026-12-24T10:00:00Z' }])).toHaveLength(1);
  });
});

describe('formatExport', () => {
  it('memuat tanggal, pertanyaan, dan isi', () => {
    const out = formatExport([{ id: 'a', prompt: 'P?', text: 'Isi', createdAt: '2026-12-24T10:00:00Z' }]);
    expect(out).toContain('2026-12-24\nP?\nIsi');
  });
});
