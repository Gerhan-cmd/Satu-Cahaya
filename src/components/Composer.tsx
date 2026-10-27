import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { rememberMyId } from '../lib/mine';
import { RepositoryError, repository } from '../lib/repository';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  CATEGORY_PROMPT,
  LIMITS,
  countChars,
  normalizeBody,
  validateBody,
  type Category,
} from '../lib/validation';
import { Button } from './ui';

type Step = 'category' | 'write' | 'preview' | 'done';
type Send = { status: 'idle' | 'sending' } | { status: 'error'; message: string };

export function Composer({ onExplore, onReceive }: { onExplore: () => void; onReceive: () => void }) {
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<Category | null>(null);
  const [text, setText] = useState('');
  const [send, setSend] = useState<Send>({ status: 'idle' });

  const validation = validateBody(text);
  const count = countChars(normalizeBody(text));
  const over = count > LIMITS.max;

  async function submit() {
    if (!category || !validation.ok) return;
    setSend({ status: 'sending' });
    try {
      const result = await repository.submit({ category, body: validation.body });
      // Hanya di perangkat ini; tidak bisa mengecualikan pesan sendiri lintas perangkat.
      rememberMyId(result.id);
      setSend({ status: 'idle' });
      setStep('done');
    } catch (e) {
      const code = e instanceof RepositoryError ? e.code : 'unavailable';
      setSend({
        status: 'error',
        message:
          code === 'rate_limited'
            ? 'Kamu sudah mengirim beberapa pesan dalam waktu singkat. Coba lagi nanti.'
            : code === 'invalid'
              ? 'Pesanmu ditolak karena tidak memenuhi aturan (panjang, tautan, atau karakter). Periksa lagi isinya.'
              : 'Pesanmu belum terkirim. Tidak ada yang tersimpan, silakan coba lagi.',
      });
    }
  }

  function reset() {
    setText('');
    setCategory(null);
    setSend({ status: 'idle' });
    setStep('category');
  }

  return (
    <section className="relative z-10 mx-auto flex min-h-dvh max-w-xl animate-rise flex-col justify-center px-6 py-24">
      {step === 'category' && (
        <>
          <p className="text-sm text-mist">Langkah 1 dari 3</p>
          <h1 className="mt-2 font-serif text-4xl">Pesan seperti apa yang ingin kamu tinggalkan?</h1>
          <ul className="mt-8 divide-y divide-mist/20">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    setStep('write');
                  }}
                  className="flex min-h-14 w-full items-center py-3 text-left text-lg hover:text-gold"
                >
                  {CATEGORY_LABEL[c]}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {step === 'write' && category && (
        <>
          <p className="text-sm text-mist">Langkah 2 dari 3 · {CATEGORY_LABEL[category]}</p>
          <label htmlFor="message-body" className="mt-2 font-serif text-3xl leading-snug">
            {CATEGORY_PROMPT[category]}
          </label>
          <textarea
            id="message-body"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            aria-describedby="message-hint"
            className="mt-6 w-full resize-none rounded-xl border border-mist/30 bg-deep/70 p-4 text-lg leading-relaxed text-ivory placeholder:text-mist/70"
            placeholder="Tulis dengan tenang. Tidak perlu menyebut nama atau data pribadi."
          />
          <p id="message-hint" className="mt-2 text-sm text-mist">
            {count}/{LIMITS.max} karakter
            {over && ` · kelebihan ${count - LIMITS.max}`}
            {!validation.ok && count > 0 && ` · ${validation.message}`}
            {count === 0 && ` · minimal ${LIMITS.min} karakter`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => setStep('category')}>
              <ArrowLeft aria-hidden="true" size={18} /> Kembali
            </Button>
            <Button disabled={!validation.ok} onClick={() => setStep('preview')}>
              Lihat pratinjau
            </Button>
          </div>
        </>
      )}

      {step === 'preview' && category && validation.ok && (
        <>
          <p className="text-sm text-mist">Langkah 3 dari 3</p>
          <div className="mt-8 text-center">
            <div
              aria-hidden="true"
              className="mx-auto h-4 w-4 rounded-full bg-ivory shadow-[0_0_32px_10px] shadow-gold/50"
            />
            <p className="mt-2 text-sm text-gold">{CATEGORY_LABEL[category]}</p>
            <blockquote className="mt-6 whitespace-pre-line font-serif text-2xl leading-snug sm:text-3xl">
              {validation.body}
            </blockquote>
          </div>
          <p className="mt-8 text-sm leading-relaxed text-mist">
            Pesanmu akan ditinjau lebih dulu dan belum tentu langsung tampil. Setelah disetujui, ia menjadi satu
            bintang anonim di langit.
          </p>
          {send.status === 'error' && (
            <p role="alert" className="mt-4 text-ivory">
              {send.message}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => setStep('write')} disabled={send.status === 'sending'}>
              <ArrowLeft aria-hidden="true" size={18} /> Ubah
            </Button>
            <Button onClick={submit} disabled={send.status === 'sending'}>
              {send.status === 'sending' ? 'Mengirim…' : 'Kirim pesan'}
            </Button>
          </div>
        </>
      )}

      {step === 'done' && (
        <div role="status" className="text-center">
          <h1 className="font-serif text-4xl">Pesanmu menunggu ditinjau.</h1>
          <p className="mt-4 text-lg leading-relaxed text-ivory/90">
            Setelah disetujui, pesanmu akan menjadi bintang di langit. Belum tentu langsung tampil.
          </p>
          {repository.mode === 'demo' && (
            <p className="mt-4 text-sm text-mist">
              Mode demo: pesanmu hanya disimpan di perangkat ini dan tidak dikirim ke server mana pun.
            </p>
          )}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={onReceive}>Terima satu cahaya</Button>
            <Button variant="ghost" onClick={onExplore}>
              Jelajahi Langit
            </Button>
            <Button variant="ghost" onClick={reset}>
              Tulis pesan lain
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
