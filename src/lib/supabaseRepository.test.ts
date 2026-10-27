import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { RepositoryError } from './repositoryTypes';
import { createSupabaseRepository } from './supabaseRepository';

const ID = '10000000-0000-0000-0000-000000000001';

function repoWith(client: unknown) {
  return createSupabaseRepository(async () => client as SupabaseClient);
}
const listClient = (rows: unknown[], error: unknown = null) => ({
  from: () => ({ select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: rows, error }) }) }) }) }),
});
const fnClient = (result: { data: unknown; error: unknown }) => ({ functions: { invoke: async () => result } });
const rpcClient = (result: { data: unknown; error: unknown }) => ({ rpc: async () => result });

describe('supabaseRepository', () => {
  it('listApproved memetakan baris, membuang baris rusak, menandai demo', async () => {
    const repo = repoWith(listClient([
      { id: ID, body: 'Isi pesan yang cukup panjang ya', category: 'harapan', is_demo: false },
      { id: 'd', body: 'Contoh demo yang cukup panjang ya', category: 'bebas', is_demo: true },
      { id: 'x', body: 'kategori rusak', category: 'lain' },
      null,
    ]));
    const list = await repo.listApproved();
    expect(list.map((m) => m.origin)).toEqual(['community', 'sample']);
  });
  it('listApproved melempar unavailable bila query gagal', async () => {
    await expect(repoWith(listClient([], { message: 'x' })).listApproved()).rejects.toMatchObject({ code: 'unavailable' });
  });
  it('submit sukses hanya bila server mengonfirmasi', async () => {
    const ok = await repoWith(fnClient({ data: { status: 'pending', id: ID }, error: null })).submit({ body: 'x'.repeat(30), category: 'bebas' });
    expect(ok).toEqual({ status: 'pending', id: ID });
    await expect(repoWith(fnClient({ data: {}, error: null })).submit({ body: 'x'.repeat(30), category: 'bebas' })).rejects.toBeInstanceOf(RepositoryError);
    await expect(repoWith(fnClient({ data: null, error: null })).submit({ body: 'x'.repeat(30), category: 'bebas' })).rejects.toMatchObject({ code: 'unavailable' });
  });
  it('submit memetakan status HTTP ke kode error', async () => {
    const withStatus = (status: number) => repoWith(fnClient({ data: null, error: { context: { status } } }));
    const input = { body: 'x'.repeat(30), category: 'bebas' as const };
    await expect(withStatus(429).submit(input)).rejects.toMatchObject({ code: 'rate_limited' });
    await expect(withStatus(400).submit(input)).rejects.toMatchObject({ code: 'invalid' });
    await expect(withStatus(500).submit(input)).rejects.toMatchObject({ code: 'unavailable' });
  });
  it('receive: kosong menghasilkan null, ada menghasilkan community', async () => {
    expect(await repoWith(rpcClient({ data: [], error: null })).receive([])).toBeNull();
    const m = await repoWith(rpcClient({ data: [{ id: ID, body: 'Isi pesan yang cukup panjang ya', category: 'syukur', is_demo: false }], error: null })).receive([]);
    expect(m).toMatchObject({ id: ID, origin: 'community' });
  });
  it('receive tidak mengembalikan pesan yang dikecualikan walau server salah', async () => {
    const row = { id: ID, body: 'Isi pesan yang cukup panjang ya', category: 'syukur' };
    expect(await repoWith(rpcClient({ data: [row], error: null })).receive([ID])).toBeNull();
  });
  it('receive hanya mengirim exclude berformat UUID', async () => {
    let sent: unknown;
    const client = { rpc: async (_: string, args: unknown) => { sent = args; return { data: [], error: null }; } };
    await repoWith(client).receive(['kurasi-01', ID, 'contoh-01']);
    expect(sent).toEqual({ p_exclude: [ID] });
  });
  it('report: sukses hanya bila diterima, 404 dan 429 dipetakan', async () => {
    await expect(repoWith(fnClient({ data: { status: 'received' }, error: null })).report(ID, 'spam')).resolves.toBeUndefined();
    await expect(repoWith(fnClient({ data: null, error: { context: { status: 404 } } })).report(ID, 'spam')).rejects.toMatchObject({ code: 'not_found' });
    await expect(repoWith(fnClient({ data: null, error: { context: { status: 429 } } })).report(ID, 'spam')).rejects.toMatchObject({ code: 'rate_limited' });
    await expect(repoWith(fnClient({ data: {}, error: null })).report(ID, 'spam')).rejects.toMatchObject({ code: 'unavailable' });
  });
});
