import { PenLine, Shuffle } from 'lucide-react';
import { CATEGORY_LABEL } from '../lib/validation';
import type { MessagesState } from '../lib/useMessages';
import { Button } from './ui';

type Props = {
  state: MessagesState;
  onSelect: (id: string) => void;
  onRandom: () => void;
  onCompose: () => void;
  onRetry: () => void;
};

export function SkyPanel({ state, onSelect, onRandom, onCompose, onRetry }: Props) {
  const messages = state.status === 'ready' ? state.messages : [];
  const allSamples = messages.length > 0 && messages.every((m) => m.origin === 'sample');

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 px-4 pb-6 text-center">
      <h1 className="sr-only">Langit Satu Cahaya</h1>
      {state.status === 'loading' && (
        <p role="status" className="text-mist">
          Menyalakan bintang…
        </p>
      )}
      {state.status === 'error' && (
        <div role="alert" className="pointer-events-auto flex flex-col items-center gap-3">
          <p className="text-ivory">{state.message}</p>
          <Button variant="ghost" onClick={onRetry}>
            Coba lagi
          </Button>
        </div>
      )}
      {state.status === 'ready' && messages.length === 0 && (
        <div className="pointer-events-auto max-w-sm">
          <p className="font-serif text-2xl">Langit ini masih sunyi.</p>
          <p className="mt-2 text-mist">Belum ada pesan yang tampil. Kamu bisa jadi cahaya pertama.</p>
        </div>
      )}
      {allSamples && (
        <p className="max-w-md text-sm text-mist">
          Bintang di sini masih berupa pesan contoh untuk demo, bukan kiriman pengunjung nyata.
        </p>
      )}
      {messages.length > 0 && <p className="text-sm text-mist">Geser langit untuk menjelajah, lalu pilih bintang untuk membaca pesannya.</p>}
      <div className="pointer-events-auto flex flex-col gap-3 sm:flex-row">
        <Button onClick={onRandom} disabled={messages.length === 0}>
          <Shuffle aria-hidden="true" size={18} /> Cahaya acak
        </Button>
        <Button variant="ghost" onClick={onCompose}>
          <PenLine aria-hidden="true" size={18} /> Nyalakan Cahaya
        </Button>
      </div>

      {/* Daftar yang dapat diakses keyboard dan pembaca layar. Muncul saat difokuskan. */}
      <ul className="pointer-events-auto">
        {messages.map((m, i) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onSelect(m.id)}
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-16 focus:rounded-full focus:bg-deep focus:px-4 focus:py-3 focus:text-ivory"
            >
              Baca bintang {i + 1}: {CATEGORY_LABEL[m.category]}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
