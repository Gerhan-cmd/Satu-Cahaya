import { readJson, writeJson } from './storage';
import type { Message } from './types';
import { isCategory } from './validation';

const KEY = 'satucahaya:favorites';
const ORIGINS = ['community', 'sample', 'curated'];

export function parseFavorites(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x) =>
        typeof x === 'object' &&
        x !== null &&
        typeof x.id === 'string' &&
        typeof x.body === 'string' &&
        isCategory(x.category) &&
        ORIGINS.includes(x.origin),
    )
    .map((x) => ({ id: x.id, body: x.body, category: x.category, origin: x.origin }));
}

export const loadFavorites = (): Message[] => readJson(KEY, parseFavorites, []);
export const saveFavorites = (items: Message[]): boolean => writeJson(KEY, items);
