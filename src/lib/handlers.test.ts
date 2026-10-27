// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { handleReport, handleSubmit, type Deps } from '../../supabase/functions/_shared/handlers';

const ID = '10000000-0000-0000-0000-000000000001';
const ORIGIN = 'https://satu-cahaya.example';

function makeDeps(over: Partial<Deps> = {}): Deps {
  return {
    allowedOrigins: [ORIGIN],
    hashKey: async (ip) => `h:${ip}`,
    rateLimit: vi.fn(async () => true),
    insertMessage: vi.fn(async () => ({ id: ID })),
    messageIsApproved: vi.fn(async () => true),
    insertReport: vi.fn(async () => undefined),
    ...over,
  };
}
const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://f.example/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, 'x-forwarded-for': '1.2.3.4, 5.6.7.8', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
const good = { body: 'Semoga harimu tenang dan penuh kebaikan kecil.', category: 'harapan' };

describe('handleSubmit', () => {
  it('menyimpan pesan valid sebagai pending (201)', async () => {
    const deps = makeDeps();
    const res = await handleSubmit(post(good), deps);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ status: 'pending', id: ID });
    expect(deps.insertMessage).toHaveBeenCalledWith({ body: good.body, category: 'harapan' });
  });
  it('menolak input tidak valid tanpa menyentuh DB atau rate limit', async () => {
    for (const bad of [{ ...good, body: 'pendek' }, { ...good, category: 'x' }, { body: 5 }, 'bukan json', [] ]) {
      const deps = makeDeps();
      const res = await handleSubmit(post(bad), deps);
      expect(res.status).toBe(400);
      expect(deps.insertMessage).not.toHaveBeenCalled();
      expect(deps.rateLimit).not.toHaveBeenCalled();
    }
  });
  it('menolak body terlalu besar (413)', async () => {
    const deps = makeDeps();
    const res = await handleSubmit(post({ ...good, body: 'a'.repeat(5000) }), deps);
    expect(res.status).toBe(413);
    expect(deps.insertMessage).not.toHaveBeenCalled();
  });
  it('429 dan tidak menyimpan bila rate limit terlampaui', async () => {
    const deps = makeDeps({ rateLimit: vi.fn(async () => false) });
    const res = await handleSubmit(post(good), deps);
    expect(res.status).toBe(429);
    expect(deps.insertMessage).not.toHaveBeenCalled();
  });
  it('memakai IP pertama dari x-forwarded-for sebagai kunci (di-hash)', async () => {
    const deps = makeDeps();
    await handleSubmit(post(good), deps);
    expect(deps.rateLimit).toHaveBeenCalledWith('submit', 'h:1.2.3.4', 3, 3600);
  });
  it('500 generik tanpa membocorkan detail bila DB gagal', async () => {
    const deps = makeDeps({ insertMessage: vi.fn(async () => { throw new Error('rahasia: connection string'); }) });
    const res = await handleSubmit(post(good), deps);
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain('rahasia');
  });
  it('500 (bukan sukses palsu) bila rate limit gagal teknis', async () => {
    const deps = makeDeps({ rateLimit: vi.fn(async () => { throw new Error('down'); }) });
    expect((await handleSubmit(post(good), deps)).status).toBe(500);
  });
  it('CORS: hanya origin yang diizinkan', async () => {
    const ok = await handleSubmit(post(good), makeDeps());
    expect(ok.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    const bad = await handleSubmit(post(good, { origin: 'https://jahat.example' }), makeDeps());
    expect(bad.headers.get('access-control-allow-origin')).toBeNull();
    const none = await handleSubmit(post(good), makeDeps({ allowedOrigins: [] }));
    expect(none.headers.get('access-control-allow-origin')).toBeNull();
  });
  it('preflight dan metode lain', async () => {
    const pre = await handleSubmit(new Request('https://f.example/x', { method: 'OPTIONS', headers: { origin: ORIGIN } }), makeDeps());
    expect(pre.status).toBe(204);
    const get = await handleSubmit(new Request('https://f.example/x', { method: 'GET' }), makeDeps());
    expect(get.status).toBe(405);
  });
});

describe('handleReport', () => {
  const ok = { messageId: ID, reason: 'spam' };
  it('mencatat laporan untuk pesan approved (202)', async () => {
    const deps = makeDeps();
    const res = await handleReport(post(ok), deps);
    expect(res.status).toBe(202);
    expect(deps.insertReport).toHaveBeenCalledWith({ messageId: ID, reason: 'spam' });
  });
  it('404 untuk pesan yang tidak publik', async () => {
    const deps = makeDeps({ messageIsApproved: vi.fn(async () => false) });
    expect((await handleReport(post(ok), deps)).status).toBe(404);
    expect(deps.insertReport).not.toHaveBeenCalled();
  });
  it('400 untuk alasan atau ID tidak valid', async () => {
    for (const bad of [{ ...ok, reason: 'asal' }, { ...ok, messageId: 'bukan-uuid' }, {}]) {
      const deps = makeDeps();
      expect((await handleReport(post(bad), deps)).status).toBe(400);
      expect(deps.insertReport).not.toHaveBeenCalled();
    }
  });
  it('429 bila rate limit terlampaui', async () => {
    const deps = makeDeps({ rateLimit: vi.fn(async () => false) });
    expect((await handleReport(post(ok), deps)).status).toBe(429);
    expect(deps.insertReport).not.toHaveBeenCalled();
  });
});
