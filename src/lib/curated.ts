import type { Message } from './types';

/** Pesan kurasi: cadangan saat belum ada pesan komunitas. Selalu diberi label di UI. */
const raw: Array<[string, Message['category'], string]> = [
  ['01', 'semangat', 'Malam ini kamu tidak perlu menyelesaikan apa pun. Cukup bernapas, dan biarkan hari ini selesai dengan sendirinya.'],
  ['02', 'harapan', 'Hal-hal baik sering datang diam-diam. Semoga kamu menyadarinya saat ia lewat.'],
  ['03', 'semangat', 'Apa pun yang kamu bawa ke akhir tahun ini, kamu boleh meletakkannya sebentar.'],
  ['04', 'syukur', 'Kebaikan kecil tetap berarti, termasuk yang tidak pernah diketahui orang lain.'],
  ['05', 'harapan', 'Semoga ada seseorang yang menyapamu dengan hangat dalam beberapa hari ke depan.'],
  ['06', 'bebas', 'Tidak apa-apa kalau tahun ini terasa lambat. Bunga juga tidak tumbuh dalam semalam.'],
];

export const CURATED_MESSAGES: Message[] = raw.map(([n, category, body]) => ({
  id: `kurasi-${n}`,
  category,
  body,
  origin: 'curated',
}));
