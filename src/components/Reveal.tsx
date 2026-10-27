import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getMyIds } from '../lib/mine';
import { ORIGIN_LABEL } from '../lib/origin';
import { receiveLight } from '../lib/receive';
import type { Message } from '../lib/types';
import { CATEGORY_LABEL } from '../lib/validation';
import { MessageActions } from './MessageActions';
import { Button } from './ui';

type State = { status: 'loading' } | { status: 'ready'; message: Message } | { status: 'error' };

type Props = {
  isSaved: (id: string) => boolean;
  saveError: string | null;
  onToggleSave: (m: Message) => void;
  onCard: (m: Message) => void;
  onReport: (m: Message) => void;
  onSky: () => void;
  onReflect: () => void;
};

export function Reveal({ isSaved, saveError, onToggleSave, onCard, onReport, onSky, onReflect }: Props) {
  const reduce = useReducedMotion();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const exclude = getMyIds();
    if (lastId.current) exclude.push(lastId.current);
    receiveLight(exclude)
      .then((message) => {
        if (cancelled) return;
        lastId.current = message.id;
        setState({ status: 'ready', message });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const again = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((a) => a + 1);
  }, []);

  return (
    <section className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-24 text-center">
      {state.status === 'loading' && (
        <p role="status" className="text-lg text-mist">
          Mencari cahaya untukmu…
        </p>
      )}

      {state.status === 'error' && (
        <div role="alert">
          <p className="font-serif text-3xl">Cahayanya belum sampai.</p>
          <p className="mt-3 text-mist">Terjadi kendala saat mengambil pesan. Tidak ada pesan yang dipalsukan.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={again}>Coba lagi</Button>
            <Button variant="ghost" onClick={onSky}>
              Ke langit
            </Button>
          </div>
        </div>
      )}

      {state.status === 'ready' && (
        <div aria-live="polite">
          <motion.div
            key={state.message.id}
            initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
          >
            <motion.div
              aria-hidden="true"
              initial={reduce ? false : { scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="mx-auto h-4 w-4 rounded-full bg-ivory shadow-[0_0_40px_14px] shadow-gold/50"
            />
            <p className="mt-3 text-sm text-gold">{CATEGORY_LABEL[state.message.category]}</p>
            <blockquote className="mt-6 whitespace-pre-line font-serif text-3xl leading-snug sm:text-4xl">
              {state.message.body}
            </blockquote>
            <p className="mt-6 text-sm text-mist">{ORIGIN_LABEL[state.message.origin]}</p>
            {state.message.origin === 'curated' && (
              <p className="mt-2 text-sm text-mist">
                Belum ada pesan pengunjung lain yang bisa kamu terima saat ini. Sambil menunggu, kamu bisa menulis
                refleksi pribadi.
              </p>
            )}
            <div className="mt-8 flex flex-col items-center gap-3">
              <MessageActions
                message={state.message}
                saved={isSaved(state.message.id)}
                error={saveError}
                onToggleSave={onToggleSave}
                onCard={onCard}
                onReport={onReport}
              />
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="ghost" onClick={again}>
                  Cahaya lain
                </Button>
                {state.message.origin === 'curated' && (
                  <Button variant="ghost" onClick={onReflect}>
                    Tulis refleksi
                  </Button>
                )}
                <Button onClick={onSky}>Kembali ke langit</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
