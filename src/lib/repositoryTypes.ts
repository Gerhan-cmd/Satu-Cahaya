import type { Message } from './types';
import type { ReportReason } from './report';
import type { Category } from './validation';

export type SubmitInput = { body: string; category: Category };
/** id hanya dikembalikan ke pengirim agar perangkatnya bisa mengecualikan pesannya sendiri. */
export type SubmitResult = { status: 'pending'; id: string };

export type RepositoryErrorCode = 'rate_limited' | 'invalid' | 'not_found' | 'unavailable';

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  constructor(code: RepositoryErrorCode) {
    super(code);
    this.name = 'RepositoryError';
    this.code = code;
  }
}

export interface MessageRepository {
  mode: 'demo' | 'supabase';
  /** Hanya pesan berstatus approved. */
  listApproved(): Promise<Message[]>;
  /** Pesan baru selalu berstatus pending; tidak pernah langsung tampil. */
  submit(input: SubmitInput): Promise<SubmitResult>;
  /** Satu pesan approved acak selain excludeIds. Null bila tidak ada yang eligible. */
  receive(excludeIds: readonly string[]): Promise<Message | null>;
  /** Melempar RepositoryError bila gagal; resolve hanya bila laporan benar-benar tercatat. */
  report(messageId: string, reason: ReportReason): Promise<void>;
}
