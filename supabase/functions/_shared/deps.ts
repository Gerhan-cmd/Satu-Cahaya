// Menyambungkan Deps ke Supabase (service role). Hanya berjalan di Deno / Edge Functions.
import { createClient } from 'npm:@supabase/supabase-js@2';
import type { Deps } from './handlers.ts';

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Env ${name} belum diset`);
  return v;
}

export function createDeps(): Deps {
  // SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY disediakan otomatis oleh platform. Jangan pernah dikirim ke frontend.
  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
  const salt = new TextEncoder().encode(env('RATE_LIMIT_SALT'));
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    allowedOrigins,
    async hashKey(ip) {
      const key = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
      return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
    },
    async rateLimit(action, key, limit, windowSeconds) {
      const { data, error } = await admin.rpc('check_rate_limit', {
        p_action: action,
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      });
      if (error) throw error;
      return data === true;
    },
    async insertMessage(m) {
      const { data, error } = await admin.from('messages').insert(m).select('id').single();
      if (error) throw error;
      return { id: data.id as string };
    },
    async messageIsApproved(id) {
      const { data, error } = await admin.from('messages').select('id').eq('id', id).eq('status', 'approved').maybeSingle();
      if (error) throw error;
      return data !== null;
    },
    async insertReport(r) {
      const { error } = await admin.from('reports').insert({ message_id: r.messageId, reason: r.reason });
      if (error) throw error;
    },
  };
}
