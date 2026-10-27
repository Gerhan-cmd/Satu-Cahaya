import type { SupabaseClient } from '@supabase/supabase-js';
import { pickMessage } from './pick';
import { RepositoryError, type MessageRepository } from './repositoryTypes';
import type { Message } from './types';
import { isCategory } from './validation';

const LIST_LIMIT = 300;
const EXCLUDE_LIMIT = 500;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = { id: string; body: string; category: string; is_demo?: boolean };

function toMessage(row: unknown): Message | null {
  if (typeof row !== 'object' || row === null) return null;
  const r = row as Row;
  if (typeof r.id !== 'string' || typeof r.body !== 'string' || !isCategory(r.category)) return null;
  return { id: r.id, body: r.body, category: r.category, origin: r.is_demo ? 'sample' : 'community' };
}

function statusOf(error: unknown): number | undefined {
  return (error as { context?: { status?: number } } | null)?.context?.status;
}

function mapFunctionError(error: unknown): RepositoryError {
  const status = statusOf(error);
  if (status === 429) return new RepositoryError('rate_limited');
  if (status === 400 || status === 413) return new RepositoryError('invalid');
  if (status === 404) return new RepositoryError('not_found');
  return new RepositoryError('unavailable');
}

export function createSupabaseRepository(getClient: () => Promise<SupabaseClient>): MessageRepository {
  return {
    mode: 'supabase',

    async listApproved() {
      const client = await getClient();
      const { data, error } = await client
        .from('messages')
        .select('id, body, category, is_demo')
        .eq('status', 'approved')
        .order('published_at', { ascending: false })
        .limit(LIST_LIMIT);
      if (error) throw new RepositoryError('unavailable');
      return (data ?? []).map(toMessage).filter((m): m is Message => m !== null);
    },

    async submit(input) {
      const client = await getClient();
      const { data, error } = await client.functions.invoke('submit-message', { body: input });
      if (error) throw mapFunctionError(error);
      // Sukses hanya bila server benar-benar mengonfirmasi pesan tercatat.
      if (!data || data.status !== 'pending' || typeof data.id !== 'string') throw new RepositoryError('unavailable');
      return { status: 'pending', id: data.id };
    },

    async receive(excludeIds) {
      const client = await getClient();
      // ID non-UUID (mis. pesan kurasi) tidak dikenal server dan akan membuat panggilan gagal.
      const exclude = excludeIds.filter((id) => UUID.test(id)).slice(-EXCLUDE_LIMIT);
      const { data, error } = await client.rpc('receive_message', { p_exclude: exclude });
      if (error) throw new RepositoryError('unavailable');
      const first = Array.isArray(data) ? data[0] : null;
      const message = first ? toMessage(first) : null;
      // Pertahanan berlapis: server sudah mengecualikan, klien memastikan sekali lagi.
      return message ? pickMessage([message], exclude) : null;
    },

    async report(messageId, reason) {
      const client = await getClient();
      const { data, error } = await client.functions.invoke('report-message', { body: { messageId, reason } });
      if (error) throw mapFunctionError(error);
      if (!data || data.status !== 'received') throw new RepositoryError('unavailable');
    },
  };
}
