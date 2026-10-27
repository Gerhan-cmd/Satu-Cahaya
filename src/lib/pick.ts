import type { Message } from './types';

/** Pilih satu pesan acak (seragam) dari yang eligible. Null bila tidak ada. */
export function pickMessage(
  pool: readonly Message[],
  excludeIds: readonly string[],
  rnd: () => number = Math.random,
): Message | null {
  const excluded = new Set(excludeIds);
  const eligible = pool.filter((m) => !excluded.has(m.id));
  if (eligible.length === 0) return null;
  return eligible[Math.min(eligible.length - 1, Math.floor(rnd() * eligible.length))];
}
