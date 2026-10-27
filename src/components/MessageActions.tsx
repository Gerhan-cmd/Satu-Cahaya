import { Bookmark, BookmarkCheck, Flag, Share2 } from 'lucide-react';
import type { Message } from '../lib/types';
import { Button } from './ui';

type Props = {
  message: Message;
  saved: boolean;
  error?: string | null;
  onToggleSave: (m: Message) => void;
  onCard: (m: Message) => void;
  onReport?: (m: Message) => void;
};

export function MessageActions({ message, saved, error, onToggleSave, onCard, onReport }: Props) {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" aria-pressed={saved} onClick={() => onToggleSave(message)}>
          {saved ? <BookmarkCheck aria-hidden="true" size={18} /> : <Bookmark aria-hidden="true" size={18} />} Simpan
        </Button>
        <Button variant="ghost" onClick={() => onCard(message)}>
          <Share2 aria-hidden="true" size={18} /> Buat kartu
        </Button>
        {onReport && message.origin !== 'curated' && (
          <Button variant="ghost" onClick={() => onReport(message)}>
            <Flag aria-hidden="true" size={18} /> Laporkan
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-ivory">
          {error}
        </p>
      )}
    </>
  );
}
