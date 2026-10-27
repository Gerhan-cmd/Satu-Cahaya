import { Star } from 'lucide-react';
import { Suspense, lazy, useCallback, useMemo, useRef, useState } from 'react';
import { CardDialog } from './components/CardDialog';
import { Composer } from './components/Composer';
import { Intro } from './components/Intro';
import { Landing } from './components/Landing';
import { MessageDialog } from './components/MessageDialog';
import { ReportDialog } from './components/ReportDialog';
import { ReflectionPad } from './components/ReflectionPad';
import { SavedList } from './components/SavedList';
import { SkyPanel } from './components/SkyPanel';
import { Starfield, type FlyTarget } from './components/Starfield';
import { markIntroSeen, shouldShowIntro } from './lib/intro';
import { repository } from './lib/repository';
import type { Message } from './lib/types';
import { useFavorites } from './lib/useFavorites';
import { useMessages } from './lib/useMessages';

// Reveal memuat library animasi; dimuat saat dibutuhkan agar landing tetap ringan.
const Reveal = lazy(() => import('./components/Reveal').then((m) => ({ default: m.Reveal })));

type View = 'landing' | 'sky' | 'compose' | 'receive' | 'reflect' | 'saved';
const EMPTY: Message[] = [];

export default function App() {
  const [intro, setIntro] = useState(shouldShowIntro);
  const endIntro = useCallback(() => {
    markIntroSeen();
    setIntro(false);
  }, []);
  const [view, setView] = useState<View>('landing');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [target, setTarget] = useState<FlyTarget | null>(null);
  const nonce = useRef(0);
  const [cardMessage, setCardMessage] = useState<Message | null>(null);
  const [reportMessage, setReportMessage] = useState<Message | null>(null);
  const { state, retry } = useMessages();
  const favorites = useFavorites();

  const messages = state.status === 'ready' ? state.messages : EMPTY;
  const selected = useMemo(() => messages.find((m) => m.id === selectedId) ?? null, [messages, selectedId]);

  const go = useCallback((v: View) => {
    setSelectedId(null);
    setView(v);
  }, []);
  const select = useCallback((id: string) => setSelectedId(id), []);
  // Terbangkan kamera ke bintang, lalu buka pesannya (onArrive).
  const goTo = useCallback((id: string) => {
    setSelectedId(null);
    setTarget({ id, nonce: ++nonce.current });
  }, []);
  const close = useCallback(() => setSelectedId(null), []);
  const closeCard = useCallback(() => setCardMessage(null), []);
  const closeReport = useCallback(() => setReportMessage(null), []);
  const random = useCallback(() => {
    if (messages.length === 0) return;
    const pool = messages.filter((m) => m.id !== selectedId);
    const list = pool.length > 0 ? pool : messages;
    goTo(list[Math.floor(Math.random() * list.length)].id);
  }, [messages, selectedId, goTo]);

  const dim = view !== 'landing' && view !== 'sky';

  return (
    <>
      {/* inert: isi aplikasi tidak bisa difokus/dibaca selama intro tampil */}
      <div className="relative min-h-dvh overflow-hidden" inert={intro}>
        <div className={`fixed inset-0 transition-opacity duration-700 ${dim ? 'opacity-40' : ''}`}>
          <Starfield
            messages={messages}
            interactive={view === 'sky'}
            selectedId={selectedId}
            onSelect={select}
            target={target}
            onArrive={select}
          />
        </div>

        <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
          <button
            type="button"
            onClick={() => go('landing')}
            className="inline-flex min-h-12 items-center gap-2 font-serif text-xl hover:text-gold"
          >
            <Star aria-hidden="true" size={18} className="text-gold" /> Satu Cahaya
          </button>
          {repository.mode === 'demo' && (
            <span className="rounded-full border border-mist/40 px-3 py-1 text-xs text-mist">Mode demo</span>
          )}
        </header>

        <main>
          {view === 'landing' && (
            <Landing
              onStart={() => go('compose')}
              onExplore={() => go('sky')}
              onReflect={() => go('reflect')}
              onSaved={() => go('saved')}
              savedCount={favorites.items.length}
            />
          )}
          {view === 'compose' && <Composer onExplore={() => go('sky')} onReceive={() => go('receive')} />}
          {view === 'receive' && (
            <Suspense
              fallback={
                <p role="status" className="relative z-10 pt-40 text-center text-mist">
                  Mencari cahaya untukmu…
                </p>
              }
            >
            <Reveal
              isSaved={favorites.isSaved}
              saveError={favorites.error}
              onToggleSave={favorites.toggle}
              onCard={setCardMessage}
              onReport={setReportMessage}
              onSky={() => go('sky')}
              onReflect={() => go('reflect')}
            />
            </Suspense>
          )}
          {view === 'reflect' && <ReflectionPad onBack={() => go('landing')} />}
          {view === 'saved' && (
            <SavedList
              items={favorites.items}
              error={favorites.error}
              onToggleSave={favorites.toggle}
              onCard={setCardMessage}
              onReport={setReportMessage}
              onBack={() => go('landing')}
            />
          )}
          {view === 'sky' && (
            <SkyPanel
              state={state}
              onSelect={goTo}
              onRandom={random}
              onCompose={() => go('compose')}
              onRetry={retry}
            />
          )}
        </main>

        <MessageDialog
          message={selected}
          saved={selected ? favorites.isSaved(selected.id) : false}
          saveError={favorites.error}
          onClose={close}
          onRandom={random}
          onToggleSave={favorites.toggle}
          onCard={setCardMessage}
          onReport={setReportMessage}
        />
        <CardDialog message={cardMessage} onClose={closeCard} />
        <ReportDialog message={reportMessage} onClose={closeReport} />
      </div>
    {intro && <Intro onDone={endIntro} />}
    </>
  );
}
