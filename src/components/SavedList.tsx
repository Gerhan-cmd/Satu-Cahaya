import { ORIGIN_LABEL } from '../lib/origin';
import type { Message } from '../lib/types';
import { CATEGORY_LABEL } from '../lib/validation';
import { Button } from './ui';

type Props = {
  items: Message[];
  error: string | null;
  onToggleSave: (m: Message) => void;
  onCard: (m: Message) => void;
  onReport: (m: Message) => void;
  onBack: () => void;
};

export function SavedList({ items, error, onToggleSave, onCard, onReport, onBack }: Props) {
  return (
    <section className="relative z-10 mx-auto min-h-dvh max-w-xl animate-rise px-6 py-24">
      <h1 className="font-serif text-4xl">Cahaya tersimpan</h1>
      <p className="mt-3 text-sm text-mist">
        Disimpan di browser ini saja. Bisa hilang bila data browser dihapus atau kamu berganti perangkat.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-ivory">
          {error}
        </p>
      )}
      {items.length === 0 && <p className="mt-8 text-mist">Belum ada pesan tersimpan.</p>}
      <ul className="mt-6 divide-y divide-mist/20">
        {items.map((m) => (
          <li key={m.id} className="py-6">
            <p className="text-sm text-gold">{CATEGORY_LABEL[m.category]}</p>
            <blockquote className="mt-2 whitespace-pre-line font-serif text-2xl leading-snug">{m.body}</blockquote>
            <p className="mt-2 text-sm text-mist">{ORIGIN_LABEL[m.origin]}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => onCard(m)}>
                Buat kartu
              </Button>
              {m.origin !== 'curated' && (
                <Button variant="ghost" onClick={() => onReport(m)}>
                  Laporkan
                </Button>
              )}
              <Button variant="ghost" onClick={() => onToggleSave(m)}>
                Hapus dari simpanan
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Button variant="ghost" onClick={onBack}>
          Kembali
        </Button>
      </div>
    </section>
  );
}
