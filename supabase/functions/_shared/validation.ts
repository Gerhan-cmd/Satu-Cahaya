// Validasi sisi server. HARUS identik dengan src/lib/validation.ts
// (dijaga oleh src/lib/parity.test.ts). Tanpa API Deno agar bisa diuji di Vitest.

export const CATEGORIES = ['harapan', 'syukur', 'pengampunan', 'semangat', 'bebas'] as const;
export const REPORT_REASONS = ['tidak_pantas', 'spam', 'data_pribadi', 'membahayakan', 'lainnya'] as const;
export const LIMITS = { min: 20, max: 400 } as const;

export function normalizeBody(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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

const LINK_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|id|io|co|me|ly)\b)/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type BodyResult =
  | { ok: true; body: string }
  | { ok: false; code: 'too_short' | 'too_long' | 'link' | 'invalid_chars' };

export function validateBody(raw: string): BodyResult {
  const body = normalizeBody(raw);
  const n = countChars(body);
  if (hasControlChars(body)) return { ok: false, code: 'invalid_chars' };
  if (n < LIMITS.min) return { ok: false, code: 'too_short' };
  if (n > LIMITS.max) return { ok: false, code: 'too_long' };
  if (LINK_PATTERN.test(body)) return { ok: false, code: 'link' };
  return { ok: true, body };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export type SubmissionResult =
  | { ok: true; body: string; category: (typeof CATEGORIES)[number] }
  | { ok: false; code: string };

export function validateSubmission(input: unknown): SubmissionResult {
  if (!isRecord(input) || typeof input.body !== 'string' || typeof input.category !== 'string') {
    return { ok: false, code: 'bad_request' };
  }
  const category = (CATEGORIES as readonly string[]).includes(input.category)
    ? (input.category as (typeof CATEGORIES)[number])
    : null;
  if (!category) return { ok: false, code: 'bad_category' };
  const r = validateBody(input.body);
  return r.ok ? { ok: true, body: r.body, category } : { ok: false, code: r.code };
}

export type ReportResult =
  | { ok: true; messageId: string; reason: (typeof REPORT_REASONS)[number] }
  | { ok: false; code: string };

export function validateReport(input: unknown): ReportResult {
  if (!isRecord(input) || typeof input.messageId !== 'string' || typeof input.reason !== 'string') {
    return { ok: false, code: 'bad_request' };
  }
  if (!UUID_PATTERN.test(input.messageId)) return { ok: false, code: 'bad_message_id' };
  if (!(REPORT_REASONS as readonly string[]).includes(input.reason)) return { ok: false, code: 'bad_reason' };
  return { ok: true, messageId: input.messageId, reason: input.reason as (typeof REPORT_REASONS)[number] };
}
