export const CATEGORIES = ['harapan', 'syukur', 'pengampunan', 'semangat', 'bebas'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  harapan: 'Harapan',
  syukur: 'Rasa syukur',
  pengampunan: 'Pengampunan',
  semangat: 'Semangat',
  bebas: 'Pesan bebas',
};

export const CATEGORY_PROMPT: Record<Category, string> = {
  harapan: 'Apa yang ingin kamu harapkan untuk seseorang yang belum kamu kenal?',
  syukur: 'Hal kecil apa yang tetap kamu syukuri tahun ini?',
  pengampunan: 'Apa yang ingin kamu lepaskan agar bisa melangkah lebih ringan?',
  semangat: 'Apa yang ingin kamu katakan kepada seseorang yang sedang menghadapi masa sulit?',
  bebas: 'Apa yang ingin kamu sampaikan kepada seseorang malam ini?',
};

export const LIMITS = { min: 20, max: 400 } as const;

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

/** Rapikan spasi dan baris kosong berlebih. */
export function normalizeBody(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Hitung karakter per code point (emoji dihitung satu). */
export function countChars(text: string): number {
  return Array.from(text).length;
}

function hasControlChars(text: string): boolean {
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (c === 10) continue;
    if (c < 32 || c === 127) return true;
  }
  return false;
}

// Filter ringan terhadap tautan/promosi. Bukan pengganti moderasi.
const LINK_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|id|io|co|me|ly)\b)/i;

export type ValidationResult =
  | { ok: true; body: string }
  | { ok: false; code: 'too_short' | 'too_long' | 'link' | 'invalid_chars'; message: string };

export function validateBody(raw: string): ValidationResult {
  const body = normalizeBody(raw);
  const n = countChars(body);
  if (hasControlChars(body)) {
    return { ok: false, code: 'invalid_chars', message: 'Pesan memuat karakter yang tidak didukung.' };
  }
  if (n < LIMITS.min) {
    return { ok: false, code: 'too_short', message: `Tulis minimal ${LIMITS.min} karakter (sekarang ${n}).` };
  }
  if (n > LIMITS.max) {
    return { ok: false, code: 'too_long', message: `Terlalu panjang: kelebihan ${n - LIMITS.max} karakter.` };
  }
  if (LINK_PATTERN.test(body)) {
    return { ok: false, code: 'link', message: 'Pesan tidak boleh memuat tautan atau alamat situs.' };
  }
  return { ok: true, body };
}
