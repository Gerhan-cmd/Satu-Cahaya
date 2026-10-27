import { Button } from './ui';

type Props = { onStart: () => void; onExplore: () => void; onReflect: () => void; onSaved: () => void; savedCount: number };

export function Landing({ onStart, onExplore, onReflect, onSaved, savedCount }: Props) {
  return (
    <section className="relative z-10 mx-auto flex min-h-dvh max-w-3xl animate-rise flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-serif text-[clamp(3.25rem,11vw,6.5rem)] font-medium leading-none">Satu Cahaya</h1>
      <p className="mt-4 font-serif text-xl italic text-gold sm:text-2xl">Leave One Light. Receive Another.</p>
      <p className="mt-2 text-base text-mist">Nyalakan satu harapan. Terima satu cahaya.</p>
      <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory/90">
        Di antara jutaan cahaya, ada pesan kecil yang mungkin kamu butuhkan malam ini. Tinggalkan satu harapan untuk
        seseorang yang belum kamu kenal, lalu temukan satu cahaya untuk dirimu.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button onClick={onStart}>Nyalakan Cahaya</Button>
        <Button variant="ghost" onClick={onExplore}>
          Jelajahi Langit
        </Button>
      </div>
      <details className="mt-10 max-w-md text-sm text-mist">
        <summary className="cursor-pointer py-2 hover:text-ivory">
          Pesan bersifat anonim dan dimoderasi. Apa artinya?
        </summary>
        <p className="mt-2 leading-relaxed">
          Kami tidak meminta nama, email, atau lokasimu. Pesan yang kamu kirim ditinjau lebih dulu, dan hanya yang
          disetujui yang tampil sebagai bintang. Tidak ada jaminan pesanmu langsung muncul. Satu Cahaya bukan layanan
          konseling atau pengganti orang-orang terdekatmu.
        </p>
      </details>
      <nav aria-label="Lainnya" className="mt-4 flex gap-2 text-sm text-mist">
        <button type="button" onClick={onReflect} className="min-h-12 px-4 hover:text-gold">
          Refleksi pribadi
        </button>
        <button type="button" onClick={onSaved} className="min-h-12 px-4 hover:text-gold">
          Tersimpan ({savedCount})
        </button>
      </nav>
    </section>
  );
}
