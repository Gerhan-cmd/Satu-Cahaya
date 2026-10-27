import { Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { newId } from '../lib/id';
import {
  REFLECTION_MAX,
  REFLECTION_PROMPTS,
  formatExport,
  loadReflections,
  saveReflections,
  type Reflection,
} from '../lib/reflections';
import { countChars, normalizeBody } from '../lib/validation';
import { Button } from './ui';

export function ReflectionPad({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<Reflection[]>(loadReflections);
  const [prompt, setPrompt] = useState<string>(REFLECTION_PROMPTS[0]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const clean = normalizeBody(text);
  const count = countChars(clean);
  const valid = count >= 1 && count <= REFLECTION_MAX;

  function persist(next: Reflection[]): boolean {
    if (!saveReflections(next)) {
      setError('Tidak bisa menyimpan di browser ini. Penyimpanan mungkin diblokir.');
      return false;
    }
    setError(null);
    setEntries(next);
    return true;
  }

  function add() {
    if (!valid) return;
    const entry: Reflection = { id: newId(), prompt, text: clean, createdAt: new Date().toISOString() };
    if (persist([entry, ...entries])) setText('');
  }

  function exportTxt() {
    const url = URL.createObjectURL(new Blob([formatExport(entries)], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'refleksi-satu-cahaya.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="relative z-10 mx-auto min-h-dvh max-w-xl animate-rise px-6 py-24">
      <h1 className="font-serif text-4xl">Refleksi pribadi</h1>
      <p className="mt-3 text-mist">
        Hanya untukmu. Tulisan ini tidak dikirim ke mana pun dan tidak pernah masuk ke langit bersama.
      </p>
      <p className="mt-2 text-sm text-mist">
        Tersimpan di browser ini saja. Bisa hilang bila data browser dihapus atau kamu berganti perangkat. Gunakan
        ekspor untuk menyimpan salinan.
      </p>

      <fieldset className="mt-8">
        <legend className="text-sm text-mist">Pilih pertanyaan</legend>
        <div className="mt-2 flex flex-col">
          {REFLECTION_PROMPTS.map((p) => (
            <label key={p} className="flex min-h-12 cursor-pointer items-center gap-3 py-2">
              <input
                type="radio"
                name="reflection-prompt"
                checked={prompt === p}
                onChange={() => setPrompt(p)}
                className="h-5 w-5 accent-gold"
              />
              <span className={prompt === p ? 'text-gold' : ''}>{p}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor="reflection-text" className="sr-only">
        Tulisan refleksimu
      </label>
      <textarea
        id="reflection-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        aria-describedby="reflection-count"
        className="mt-4 w-full resize-none rounded-xl border border-mist/30 bg-deep/70 p-4 text-lg leading-relaxed text-ivory"
      />
      <p id="reflection-count" className="mt-2 text-sm text-mist">
        {count}/{REFLECTION_MAX} karakter{count > REFLECTION_MAX && ` · kelebihan ${count - REFLECTION_MAX}`}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-ivory">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="ghost" onClick={onBack}>
          Kembali
        </Button>
        <Button disabled={!valid} onClick={add}>
          Simpan di perangkat ini
        </Button>
      </div>

      <div className="mt-12 flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">Tulisanmu</h2>
        <Button variant="ghost" disabled={entries.length === 0} onClick={exportTxt}>
          <Download aria-hidden="true" size={18} /> Ekspor .txt
        </Button>
      </div>
      {entries.length === 0 && <p className="mt-4 text-mist">Belum ada tulisan.</p>}
      <ul className="mt-4 divide-y divide-mist/20">
        {entries.map((e) => (
          <li key={e.id} className="py-5">
            <p className="text-sm text-gold">
              {new Date(e.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="mt-1 text-sm text-mist">{e.prompt}</p>
            <p className="mt-2 whitespace-pre-line leading-relaxed">{e.text}</p>
            <button
              type="button"
              onClick={() => persist(entries.filter((x) => x.id !== e.id))}
              className="mt-3 inline-flex min-h-12 items-center gap-2 text-sm text-mist hover:text-ivory"
            >
              <Trash2 aria-hidden="true" size={16} /> Hapus tulisan ini
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
