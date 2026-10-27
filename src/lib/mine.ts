import { readJson, writeJson } from './storage';

const KEY = 'satucahaya:mine';
const MAX = 200;

/**
 * ID pesan yang dikirim dari perangkat ini, hanya di localStorage.
 * Keterbatasan: tidak berlaku lintas perangkat/browser, dan hilang bila data browser dihapus.
 */
export function getMyIds(): string[] {
  return readJson(KEY, (r) => (Array.isArray(r) ? r.filter((x): x is string => typeof x === 'string') : []), []);
}

export function rememberMyId(id: string): boolean {
  return writeJson(KEY, [id, ...getMyIds().filter((x) => x !== id)].slice(0, MAX));
}
