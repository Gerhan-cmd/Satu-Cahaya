/** Baca JSON dari localStorage. Data rusak atau storage diblokir menghasilkan fallback. */
export function readJson<T>(key: string, parse: (raw: unknown) => T, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s === null ? fallback : parse(JSON.parse(s));
  } catch {
    return fallback;
  }
}

/** Tulis JSON. Mengembalikan false bila gagal, agar UI bisa menampilkan error. */
export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
