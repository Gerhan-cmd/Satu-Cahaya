import { CURATED_MESSAGES } from './curated';
import { pickMessage } from './pick';
import { repository } from './repository';
import type { Message } from './types';

/**
 * Ambil satu cahaya. Kegagalan repository dilempar (UI menampilkan error), tidak dipalsukan.
 * Pesan kurasi hanya dipakai bila memang tidak ada pesan komunitas yang eligible.
 */
export async function receiveLight(excludeIds: readonly string[]): Promise<Message> {
  const community = await repository.receive(excludeIds);
  if (community) return community;
  return pickMessage(CURATED_MESSAGES, excludeIds) ?? pickMessage(CURATED_MESSAGES, [])!;
}
