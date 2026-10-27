import { Shuffle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ORIGIN_LABEL } from '../lib/origin';
import type { Message } from '../lib/types';
import { CATEGORY_LABEL } from '../lib/validation';
import { MessageActions } from './MessageActions';
import { Button } from './ui';

type Props = {
  message: Message | null;
  saved: boolean;
  saveError: string | null;
  onClose: () => void;
  onRandom: () => void;
  onToggleSave: (m: Message) => void;
  onCard: (m: Message) => void;
  onReport: (m: Message) => void;
};

/** Memakai <dialog> native: fokus terkunci, Esc menutup, dan dikenali pembaca layar. */
export function MessageDialog({ message, saved, saveError, onClose, onRandom, onToggleSave, onCard, onReport }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (message && !d.open) d.showModal();
    if (!message && d.open) d.close();
  }, [message]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="message-dialog-title"
      className="m-auto w-[min(92vw,34rem)] bg-transparent p-0 text-ivory"
    >
      {message && (
        <div className="max-h-[92dvh] overflow-y-auto rounded-2xl border border-gold/30 bg-deep p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id="message-dialog-title" className="text-sm font-medium tracking-wide text-gold">
              Cahaya · {CATEGORY_LABEL[message.category]}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pesan"
              className="-m-3 inline-flex h-12 w-12 items-center justify-center rounded-full text-mist hover:text-ivory"
            >
              <X aria-hidden="true" size={22} />
            </button>
          </div>
          <blockquote className="my-8 whitespace-pre-line font-serif text-2xl leading-snug sm:text-3xl">
            {message.body}
          </blockquote>
          {message.origin !== 'community' && <p className="mb-6 text-sm text-mist">{ORIGIN_LABEL[message.origin]}</p>}
          <MessageActions message={message} saved={saved} error={saveError} onToggleSave={onToggleSave} onCard={onCard} onReport={onReport} />
          <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="ghost" onClick={onRandom}>
              <Shuffle aria-hidden="true" size={18} /> Cahaya lain
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
