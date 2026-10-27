import { demoRepository } from './demoRepository';
import type { MessageRepository } from './repositoryTypes';
import { SUPABASE_ANON_KEY, SUPABASE_URL, getSupabaseClient } from './supabaseClient';
import { createSupabaseRepository } from './supabaseRepository';

export * from './repositoryTypes';

/** Supabase bila env tersedia; jika tidak, mode demo lokal (diberi badge di UI). */
export const repository: MessageRepository =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createSupabaseRepository(getSupabaseClient) : demoRepository;
