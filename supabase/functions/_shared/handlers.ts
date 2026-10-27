// Logika permintaan murni (dependensi diinjeksi) agar bisa diuji tanpa Deno/Supabase.
import { validateReport, validateSubmission } from './validation.ts';

export type Deps = {
  /** Origin yang diizinkan (env ALLOWED_ORIGINS). Kosong = semua lintas-origin ditolak. */
  allowedOrigins: string[];
  /** HMAC(IP) dengan salt rahasia; IP asli tidak pernah disimpan. */
  hashKey(ip: string): Promise<string>;
  /** Mengembalikan false bila batas terlampaui. Gagal teknis = melempar. */
  rateLimit(action: string, key: string, limit: number, windowSeconds: number): Promise<boolean>;
  insertMessage(m: { body: string; category: string }): Promise<{ id: string }>;
  messageIsApproved(id: string): Promise<boolean>;
  insertReport(r: { messageId: string; reason: string }): Promise<void>;
};

const MAX_BODY_BYTES = 4096;

function corsHeaders(req: Request, deps: Deps): Record<string, string> {
  const origin = req.headers.get('origin');
  const base: Record<string, string> = { Vary: 'Origin' };
  if (origin && deps.allowedOrigins.includes(origin)) {
    base['Access-Control-Allow-Origin'] = origin;
    base['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
    base['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    base['Access-Control-Max-Age'] = '600';
  }
  return base;
}

function json(req: Request, deps: Deps, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req, deps), 'Content-Type': 'application/json' },
  });
}

async function readJson(req: Request): Promise<{ ok: true; value: unknown } | { ok: false; status: number }> {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return { ok: false, status: 413 };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400 };
  }
}

function clientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

async function guard(req: Request, deps: Deps): Promise<Response | null> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req, deps) });
  if (req.method !== 'POST') return json(req, deps, 405, { code: 'method_not_allowed' });
  return null;
}

export async function handleSubmit(req: Request, deps: Deps): Promise<Response> {
  const early = await guard(req, deps);
  if (early) return early;
  try {
    const parsed = await readJson(req);
    if (!parsed.ok) return json(req, deps, parsed.status, { code: parsed.status === 413 ? 'too_large' : 'bad_request' });
    const v = validateSubmission(parsed.value);
    if (!v.ok) return json(req, deps, 400, { code: v.code });

    const key = await deps.hashKey(clientIp(req));
    const hourOk = await deps.rateLimit('submit', key, 3, 3600);
    const dayOk = hourOk && (await deps.rateLimit('submit_day', key, 10, 86400));
    if (!hourOk || !dayOk) return json(req, deps, 429, { code: 'rate_limited' });

    const { id } = await deps.insertMessage({ body: v.body, category: v.category });
    return json(req, deps, 201, { status: 'pending', id });
  } catch {
    // Jangan bocorkan detail internal maupun isi pesan.
    return json(req, deps, 500, { code: 'server_error' });
  }
}

export async function handleReport(req: Request, deps: Deps): Promise<Response> {
  const early = await guard(req, deps);
  if (early) return early;
  try {
    const parsed = await readJson(req);
    if (!parsed.ok) return json(req, deps, parsed.status, { code: parsed.status === 413 ? 'too_large' : 'bad_request' });
    const v = validateReport(parsed.value);
    if (!v.ok) return json(req, deps, 400, { code: v.code });

    const key = await deps.hashKey(clientIp(req));
    if (!(await deps.rateLimit('report', key, 10, 3600))) return json(req, deps, 429, { code: 'rate_limited' });

    // Hanya pesan yang sedang publik yang bisa dilaporkan.
    if (!(await deps.messageIsApproved(v.messageId))) return json(req, deps, 404, { code: 'not_found' });
    await deps.insertReport({ messageId: v.messageId, reason: v.reason });
    return json(req, deps, 202, { status: 'received' });
  } catch {
    return json(req, deps, 500, { code: 'server_error' });
  }
}
