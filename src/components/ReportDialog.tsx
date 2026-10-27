import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { REPORT_REASONS, REPORT_REASON_LABEL, type ReportReason } from '../lib/report';
import { RepositoryError, repository } from '../lib/repository';
import type { Message } from '../lib/types';
import { Button } from './ui';

type Status = { s: 'idle' | 'sending' | 'done' } | { s: 'error'; text: string };

function ReportBody({ message, onClose }: { message: Message; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [status, setStatus] = useState<Status>({ s: 'idle' });

  async function send() {
    if (!reason) return;
    setStatus({ s: 'sending' });
    try {
      await repository.report(message.id, reason);
      setStatus({ s: 'done' });
    } catch (e) {
      const code = e instanceof RepositoryError ? e.code : 'unavailable';
      setStatus({
        s: 'error',
        text:
          code === 'rate_limited'
            ? 'Terlalu banyak laporan dalam waktu singkat. Coba lagi nanti.'
            : code === 'not_found'
              ? 'Pesan ini sudah tidak tampil, jadi tidak bisa dilaporkan.'
              : 'Laporanmu belum terkirim. Silakan coba lagi.',
      });
    }
  }

  return (
    <div className="max-h-[92dvh] overflow-y-auto rounded-2xl border border-gold/30 bg-deep p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <h2 id="report-dialog-title" className="font-serif text-2xl">
          Laporkan pesan
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup laporan"
          className="-m-3 inline-flex h-12 w-12 items-center justify-center rounded-full text-mist hover:text-ivory"
        >
          <X aria-hidden="true" size={22} />
        </button>
      </div>

      {status.s === 'done' ? (
        <div role="status" className="mt-4">
          <p>Terima kasih. Laporanmu akan ditinjau.</p>
          {repository.mode === 'demo' && (
            <p className="mt-2 text-sm text-mist">Mode demo: laporan hanya disimpan di perangkat ini.</p>
          )}
          <div className="mt-6">
            <Button onClick={onClose}>Tutup</Button>
          </div>
        </div>
      ) : (
        <>
          <blockquote className="mt-4 line-clamp-3 font-serif text-lg text-mist">{message.body}</blockquote>
          <fieldset className="mt-4">
            <legend className="text-sm text-mist">Alasan</legend>
            {REPORT_REASONS.map((r) => (
              <label key={r} className="flex min-h-12 cursor-pointer items-center gap-3 py-1">
                <input
                  type="radio"
                  name="report-reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="h-5 w-5 accent-gold"
                />
                {REPORT_REASON_LABEL[r]}
              </label>
            ))}
          </fieldset>
          {status.s === 'error' && (
            <p role="alert" className="mt-3 text-ivory">
              {status.text}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="ghost" onClick={onClose} disabled={status.s === 'sending'}>
              Batal
            </Button>
            <Button onClick={send} disabled={!reason || status.s === 'sending'}>
              {status.s === 'sending' ? 'Mengirim…' : 'Kirim laporan'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function ReportDialog({ message, onClose }: { message: Message | null; onClose: () => void }) {
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
      aria-labelledby="report-dialog-title"
      className="m-auto w-[min(92vw,30rem)] bg-transparent p-0 text-ivory"
    >
      {message && <ReportBody key={message.id} message={message} onClose={onClose} />}
    </dialog>
  );
}
