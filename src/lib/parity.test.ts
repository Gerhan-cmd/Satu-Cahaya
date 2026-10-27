// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as server from '../../supabase/functions/_shared/validation';
import { REPORT_REASONS } from './report';
import { CATEGORIES, LIMITS, validateBody } from './validation';

const sql = readFileSync(new URL('../../supabase/migrations/20261015000000_init.sql', import.meta.url), 'utf8');

const samples = [
  '', 'halo', 'a'.repeat(19), 'a'.repeat(20), 'a'.repeat(400), 'a'.repeat(401),
  '  ' + 'b'.repeat(20) + '  ', 'Kunjungi https://contoh.com ya teman', 'lihat www.situs.net sekarang juga',
  'tulis di contoh.id untuk info', 'Pesan dengan\u0000kontrol di dalamnya ya', 'baris\n\n\n\nbanyak sekali di sini ya',
  '🌟'.repeat(20), 'Semoga harimu tenang dan penuh kebaikan kecil.',
];

describe('paritas validasi klien dan server', () => {
  it('batas dan daftar sama', () => {
    expect(server.LIMITS).toEqual(LIMITS);
    expect([...server.CATEGORIES]).toEqual([...CATEGORIES]);
    expect([...server.REPORT_REASONS]).toEqual([...REPORT_REASONS]);
  });
  it.each(samples)('hasil sama untuk %j', (s) => {
    const a = validateBody(s);
    const b = server.validateBody(s);
    expect(b.ok).toBe(a.ok);
    if (a.ok && b.ok) expect(b.body).toBe(a.body);
    if (!a.ok && !b.ok) expect(b.code).toBe(a.code);
  });
  it('constraint SQL memuat semua kategori, alasan laporan, dan batas panjang', () => {
    for (const c of CATEGORIES) expect(sql).toContain(`'${c}'`);
    for (const r of REPORT_REASONS) expect(sql).toContain(`'${r}'`);
    expect(sql).toContain(`between ${LIMITS.min} and ${LIMITS.max}`);
  });
});
