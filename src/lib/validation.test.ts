import { describe, expect, it } from 'vitest';
import { LIMITS, countChars, isCategory, normalizeBody, validateBody } from './validation';

describe('validateBody', () => {
  it('menolak pesan terlalu pendek', () => {
    const r = validateBody('halo');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('too_short');
  });
  it('menolak pesan terlalu panjang', () => {
    const r = validateBody('a'.repeat(LIMITS.max + 1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('too_long');
  });
  it('menerima batas tepat', () => {
    expect(validateBody('a'.repeat(LIMITS.min)).ok).toBe(true);
    expect(validateBody('a'.repeat(LIMITS.max)).ok).toBe(true);
  });
  it('menolak tautan', () => {
    const r = validateBody('Kunjungi https://contoh.com untuk info lebih lanjut ya');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('link');
  });
  it('menolak karakter kontrol', () => {
    const r = validateBody('Semoga harimu menyenangkan\u0000 dan tenang');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('invalid_chars');
  });
  it('spasi tepi tidak dihitung', () => {
    expect(validateBody('   ' + 'a'.repeat(LIMITS.min - 1) + '   ').ok).toBe(false);
  });
  it('menghitung emoji sebagai satu karakter', () => {
    expect(countChars('🌟')).toBe(1);
  });
});

describe('normalizeBody', () => {
  it('merapikan spasi dan baris kosong', () => {
    expect(normalizeBody('a   b\r\n\n\n\nc ')).toBe('a b\n\nc');
  });
});

describe('isCategory', () => {
  it('memvalidasi kategori', () => {
    expect(isCategory('harapan')).toBe(true);
    expect(isCategory('lain')).toBe(false);
    expect(isCategory(undefined)).toBe(false);
  });
});
