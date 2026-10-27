import { readJson, writeJson } from './storage';

export const REFLECTION_PROMPTS = [
  'Apa yang paling kamu syukuri tahun ini?',
  'Apa yang ingin kamu tinggalkan sebelum memasuki tahun baru?',
  'Apa satu hal kecil yang ingin kamu lakukan untuk dirimu sendiri?',
  'Apa yang ingin kamu harapkan untuk tahun depan?',
] as const;

export const REFLECTION_MAX = 2000;
const KEY = 'satucahaya:reflections';

export type Reflection = { id: string; prompt: string; text: string; createdAt: string };

export function parseReflections(raw: unknown): Reflection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x) =>
        typeof x === 'object' &&
        x !== null &&
        typeof x.id === 'string' &&
        typeof x.prompt === 'string' &&
        typeof x.text === 'string' &&
        typeof x.createdAt === 'string',
    )
    .map((x) => ({ id: x.id, prompt: x.prompt, text: x.text, createdAt: x.createdAt }));
}

export const loadReflections = (): Reflection[] => readJson(KEY, parseReflections, []);
export const saveReflections = (items: Reflection[]): boolean => writeJson(KEY, items);

export function formatExport(items: readonly Reflection[]): string {
  const head = 'Refleksi pribadi — Satu Cahaya\n\n';
  return head + items.map((e) => `${e.createdAt.slice(0, 10)}\n${e.prompt}\n${e.text}`).join('\n\n---\n\n') + '\n';
}
