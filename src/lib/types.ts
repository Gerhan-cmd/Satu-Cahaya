import type { Category } from './validation';

export type Origin = 'community' | 'sample' | 'curated';

/** Data publik sebuah pesan. Tidak ada ID pengirim, moderasi, atau metadata privat. */
export type Message = {
  id: string;
  body: string;
  category: Category;
  /** community = kiriman pengunjung yang disetujui; sample = contoh demo; curated = pesan kurasi. */
  origin: Origin;
};
