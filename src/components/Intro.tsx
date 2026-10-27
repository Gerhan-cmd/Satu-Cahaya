import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { INTRO_AUTO_MS, INTRO_FADE_MS } from '../lib/intro';
import {
  DOME,
  DOTS,
  FIGURE_BODY,
  FIGURE_HEAD,
  HILL,
  RAYS,
  RAY_ORIGIN,
  STAR,
  STAR_PATH,
} from '../lib/logoGeometry';

/** Penundaan animasi per elemen (detik) lewat custom property --d. */
const at = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties;

/**
 * Intro hitam-putih dari desain logo: bukit tergambar, sosok muncul, jejak titik,
 * bintang menyala, lalu cahaya menyebar. Dapat dilewati (tombol / Esc).
 * Reduced-motion: langsung bingkai akhir, tanpa penutupan otomatis.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [reduce] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const closed = useRef(false);

  const finish = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    setLeaving(true);
    window.setTimeout(onDone, INTRO_FADE_MS);
  }, [onDone]);

  useEffect(() => {
    const timer = reduce ? undefined : window.setTimeout(finish, INTRO_AUTO_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [finish, reduce]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pembuka Satu Cahaya"
      className={`intro fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 text-white transition-opacity duration-[600ms] ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        autoFocus
        onClick={finish}
        className="absolute right-4 top-4 inline-flex min-h-12 items-center rounded-full border border-white/40 px-5 text-base text-white hover:border-white"
      >
        {reduce ? 'Masuk' : 'Lewati'}
      </button>

      <svg viewBox="0 0 400 400" aria-hidden="true" className="w-[min(80vw,24rem)]">
        <defs>
          <clipPath id="intro-dome">
            <path d={DOME} />
          </clipPath>
          <linearGradient id="intro-dome-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".38" />
            <stop offset=".6" stopColor="#fff" stopOpacity=".12" />
            <stop offset="1" stopColor="#fff" stopOpacity=".02" />
          </linearGradient>
          <linearGradient
            id="intro-ray-fill"
            gradientUnits="userSpaceOnUse"
            x1={RAY_ORIGIN.x}
            y1={RAY_ORIGIN.y}
            x2={RAY_ORIGIN.x}
            y2="330"
          >
            <stop offset="0" stopColor="#fff" stopOpacity=".8" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="intro-glow-fill">
            <stop offset="0" stopColor="#fff" stopOpacity=".85" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path d={DOME} fill="url(#intro-dome-fill)" className="i-fade" style={at(3.7)} />
        <g clipPath="url(#intro-dome)" fill="url(#intro-ray-fill)">
          {RAYS.map((r, i) => (
            <path key={i} d={r.path} className="i-ray" style={at(3.3 + r.rank * 0.1)} />
          ))}
        </g>
        <circle cx={STAR.x} cy={STAR.y} r="52" fill="url(#intro-glow-fill)" className="i-glow" style={at(2.8)} />
        <path d={STAR_PATH} fill="#fff" className="i-pop" style={at(2.8)} />

        <path
          d={HILL}
          pathLength="1"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="i-draw"
          style={at(0.2)}
        />
        <g fill="#fff" className="i-rise" style={at(1.2)}>
          <circle cx={FIGURE_HEAD.cx} cy={FIGURE_HEAD.cy} r={FIGURE_HEAD.r} />
          <path d={FIGURE_BODY} />
        </g>
        {DOTS.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="#fff" className="i-fade" style={at(1.7 + i * 0.18)} />
        ))}
      </svg>

      <p className="i-rise mt-6 font-serif text-4xl" style={at(4.7)}>
        Satu Cahaya
      </p>
      <p className="i-rise mt-2 text-sm text-white/70" style={at(5.0)}>
        Nyalakan satu harapan. Terima satu cahaya.
      </p>
    </div>
  );
}
