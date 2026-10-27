import type { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL: string | undefined = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: Promise<SupabaseClient> | null = null;

/** Dimuat dinamis agar mode demo tidak mengunduh supabase-js. Hanya memakai anon/publishable key. */
export function getSupabaseClient(): Promise<SupabaseClient> {
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: false } }),
  );
  return client;
}
