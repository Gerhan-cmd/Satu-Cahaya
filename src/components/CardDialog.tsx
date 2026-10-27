import { Download, Share2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { renderCardBlob } from '../lib/shareCard';
import type { Message } from '../lib/types';
import { buttonClass } from './buttonClass';
import { Button } from './ui';

type CardState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; url: string; blob: Blob };

function CardBody({ message, onClose }: { message: Message; onClose: () => void }) {
  const [state, setState] = useState<CardState>({ status: 'loading' });
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    renderCardBlob(message)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setState({ status: 'ready', url, blob });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [message]);

  const file = useMemo(
    () => (state.status === 'ready' ? new File([state.blob], 'satu-cahaya.png', { type: 'image/png' }) : null),
    [state],
  );
  const canShare = !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

  async function share() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: 'Satu Cahaya' });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        setNote('Gagal membagikan. Gunakan tombol Unduh, lalu bagikan gambarnya secara manual.');
      }
    }
  }

  return (
    <div className="max-h-[94dvh] overflow-y-auto rounded-2xl border border-gold/30 bg-deep p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id="card-dialog-title" className="text-sm font-medium tracking-wide text-gold">
          Kartu pesan
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup kartu"
          className="-m-3 inline-flex h-12 w-12 items-center justify-center rounded-full text-mist hover:text-ivory"
        >
          <X aria-hidden="true" size={22} />
        </button>
      </div>
      <div className="mt-4 flex min-h-48 items-center justify-center">
        {state.status === 'loading' && (
          <p role="status" className="text-mist">
            Menyiapkan kartu…
          </p>
        )}
        {state.status === 'error' && (
          <p role="alert" className="text-ivory">
            Kartu belum bisa dibuat di perangkat ini. Silakan coba lagi.
          </p>
        )}
        {state.status === 'ready' && (
          <img
            src={state.url}
            alt={`Kartu pesan: ${message.body}`}
            className="max-h-[58dvh] w-auto max-w-full rounded-lg"
          />
        )}
      </div>
      {state.status === 'ready' && (
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={state.url} download="satu-cahaya.png" className={buttonClass('primary')}>
            <Download aria-hidden="true" size={18} /> Unduh
          </a>
          {canShare && (
            <Button variant="ghost" onClick={share}>
              <Share2 aria-hidden="true" size={18} /> Bagikan
            </Button>
          )}
        </div>
      )}
      {state.status === 'ready' && !canShare && (
        <p className="mt-3 text-sm text-mist">
          Perangkat ini belum mendukung berbagi langsung. Unduh gambarnya, lalu bagikan secara manual.
        </p>
      )}
      {note && (
        <p role="alert" className="mt-3 text-sm text-ivory">
          {note}
        </p>
      )}
    </div>
  );
}

export function CardDialog({ message, onClose }: { message: Message | null; onClose: () => void }) {
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
      aria-labelledby="card-dialog-title"
      className="m-auto w-[min(94vw,32rem)] bg-transparent p-0 text-ivory"
    >
      {message && <CardBody key={message.id} message={message} onClose={onClose} />}
    </dialog>
  );
}
