import { useEffect, useRef, type KeyboardEvent } from 'react';
import { WORLD, centerOn, clampCamera, easeOutCubic, wrap, type Vec } from '../lib/camera';
import {
  CONSTELLATION_PARALLAX,
  constellationLayerSize,
  placeConstellations,
  type PlacedConstellation,
} from '../lib/constellations';
import { mulberry32 } from '../lib/prng';
import { layoutStars } from '../lib/starLayout';
import { COLORS, GOLD_RGB, MIST_RGB } from '../lib/tokens';
import type { Message } from '../lib/types';

export type FlyTarget = { id: string; nonce: number };

type Props = {
  messages: Message[];
  interactive: boolean;
  selectedId: string | null;
  /** Dipanggil saat bintang diklik/disentuh langsung. */
  onSelect: (id: string) => void;
  /** Terbangkan kamera ke bintang ini; onArrive dipanggil setelah sampai. */
  target: FlyTarget | null;
  onArrive: (id: string) => void;
};

type BgStar = { x: number; y: number; r: number; a: number; p: number; s: number };
type Layer = { stars: BgStar[]; f: number };
type MsgStar = { id: string; wx: number; wy: number; r: number; p: number };
type Api = { panBy: (dx: number, dy: number) => void; flyTo: (id: string) => boolean };

const TAU = Math.PI * 2;
const HIT_RADIUS = 24; // px, nyaman untuk sentuhan
const DRAG_THRESHOLD = 6; // px sebelum gerakan dianggap menggeser, bukan mengetuk
const PAN_STEP = 90;
const FLY_MS = 800;
const LINK_DISTANCE = 380; // jarak dunia maksimum untuk garis penghubung

/** Peta langit Canvas 2D yang dapat digeser. Dekoratif (aria-hidden); akses keyboard lewat SkyPanel dan panah. */
export function Starfield({ messages, interactive, selectedId, onSelect, target, onArrive }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const camRef = useRef({ x: 0, y: 0, init: false });
  const live = useRef({ hoverId: null as string | null, selectedId, interactive, onSelect, onArrive });
  const redraw = useRef<(() => void) | null>(null);
  const api = useRef<Api | null>(null);

  useEffect(() => {
    Object.assign(live.current, { selectedId, interactive, onSelect, onArrive });
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = interactive ? 'grab' : 'default';
      canvas.style.touchAction = interactive ? 'none' : 'auto';
    }
    redraw.current?.();
  }, [selectedId, interactive, onSelect, onArrive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const cam = camRef.current;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let prevT = 0;
    let layers: Layer[] = [];
    let rasi: PlacedConstellation[] = [];
    let stars: MsgStar[] = [];
    let lines: Array<[MsgStar, MsgStar]> = [];
    let drag: { id: number; sx: number; sy: number; cx: number; cy: number; lastT: number; moved: boolean } | null = null;
    const vel: Vec = { x: 0, y: 0 };
    let fly: { id: string; from: Vec; to: Vec; start: number | null } | null = null;

    const clamp = () => {
      const c = clampCamera(cam, { w, h }, WORLD);
      cam.x = c.x;
      cam.y = c.y;
    };

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = w < 640 || lowPower ? 9000 : 5000;
      const total = Math.min(600, Math.floor((w * h) / density));
      const rnd = mulberry32(20251225);
      const make = (count: number, f: number, rMax: number, aMax: number): Layer => ({
        f,
        stars: Array.from({ length: count }, () => ({
          x: rnd() * w,
          y: rnd() * h,
          r: 0.4 + rnd() * rMax,
          a: 0.2 + rnd() * aMax,
          p: rnd() * TAU,
          s: 0.4 + rnd() * 1.2,
        })),
      });
      layers = [make(Math.floor(total * 0.55), 0.2, 0.6, 0.35), make(Math.floor(total * 0.45), 0.5, 1.0, 0.5)];

      const ls = constellationLayerSize({ w, h }, WORLD);
      rasi = placeConstellations(ls.w, ls.h);

      stars = layoutStars(
        messages.map((m) => m.id),
        WORLD,
      ).map((p) => ({ id: p.id, wx: p.wx, wy: p.wy, r: p.size, p: p.phase }));

      // Hubungkan tiap bintang ke tetangga terdekat bila cukup dekat (tanpa garis ganda).
      lines = [];
      const seen = new Set<string>();
      for (const a of stars) {
        let best: MsgStar | null = null;
        let bestD = LINK_DISTANCE;
        for (const b of stars) {
          if (a === b) continue;
          const d = Math.hypot(a.wx - b.wx, a.wy - b.wy);
          if (d < bestD) {
            bestD = d;
            best = b;
          }
        }
        if (!best) continue;
        const key = a.id < best.id ? `${a.id}|${best.id}` : `${best.id}|${a.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          lines.push([a, best]);
        }
      }

      if (!cam.init) {
        cam.x = (WORLD.w - w) / 2;
        cam.y = (WORLD.h - h) / 2;
        cam.init = true;
      }
      clamp();
    };

    const drawMinimap = (sel: string | null) => {
      const mw = w < 500 ? 84 : 120;
      const mh = (mw * WORLD.h) / WORLD.w;
      const x0 = w - mw - 12;
      const y0 = 64;
      ctx.fillStyle = 'rgba(7,17,31,0.55)';
      ctx.fillRect(x0, y0, mw, mh);
      ctx.strokeStyle = `rgba(${GOLD_RGB},0.3)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, mw - 1, mh - 1);
      for (const s of stars) {
        ctx.fillStyle = s.id === sel ? COLORS.ivory : COLORS.gold;
        const size = s.id === sel ? 4 : 2;
        ctx.fillRect(x0 + (s.wx / WORLD.w) * mw - size / 2, y0 + (s.wy / WORLD.h) * mh - size / 2, size, size);
      }
      ctx.strokeStyle = COLORS.ivory;
      ctx.strokeRect(
        x0 + (cam.x / WORLD.w) * mw,
        y0 + (cam.y / WORLD.h) * mh,
        Math.min((w / WORLD.w) * mw, mw),
        Math.min((h / WORLD.h) * mh, mh),
      );
    };

    /** Rasi dekoratif: biru-abu redup, bergeser dengan parallax lambat, tidak pernah bisa diklik. */
    const drawConstellations = (t: number, motion: boolean) => {
      const ox = -cam.x * CONSTELLATION_PARALLAX;
      const oy = -cam.y * CONSTELLATION_PARALLAX;
      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';
      for (const { c, x, y, size } of rasi) {
        const k = size / 100;
        const left = x + ox;
        const top = y + oy;
        if (left > w + 40 || left + size < -40 || top > h + 60 || top + size < -40) continue;
        ctx.strokeStyle = `rgba(${MIST_RGB},0.26)`;
        for (const line of c.lines) {
          ctx.beginPath();
          line.forEach((i, n) => {
            const px = left + c.points[i][0] * k;
            const py = top + c.points[i][1] * k;
            if (n === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
        }
        c.points.forEach(([px, py], i) => {
          const tw = motion ? 0.75 + 0.25 * Math.sin((t / 1000) * 0.7 + i * 1.7 + c.points.length) : 1;
          const sx = left + px * k;
          const sy = top + py * k;
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 7);
          g.addColorStop(0, `rgba(${MIST_RGB},${0.4 * tw})`);
          g.addColorStop(1, `rgba(${MIST_RGB},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(sx, sy, 7, 0, TAU);
          ctx.fill();
          ctx.fillStyle = `rgba(${MIST_RGB},${0.85 * tw})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.7, 0, TAU);
          ctx.fill();
        });
        ctx.fillStyle = `rgba(${MIST_RGB},0.42)`;
        ctx.font = 'italic 500 15px "Cormorant Garamond", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.name, left + size / 2, top + size + 14);
      }
    };

    const draw = (t: number) => {
      const motion = !motionQuery.matches;
      const { hoverId, selectedId: sel, interactive: canPan } = live.current;
      ctx.clearRect(0, 0, w, h);

      // Lapisan latar: parallax (bergeser lebih lambat dari kamera) dan menyambung tanpa batas.
      ctx.fillStyle = COLORS.ivory;
      for (const layer of layers) {
        for (const s of layer.stars) {
          const x = wrap(s.x - cam.x * layer.f, w);
          const y = wrap(s.y - cam.y * layer.f, h);
          const tw = motion ? 0.75 + 0.25 * Math.sin((t / 1000) * s.s + s.p) : 1;
          ctx.globalAlpha = s.a * tw;
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      drawConstellations(t, motion);

      ctx.strokeStyle = `rgba(${GOLD_RGB},0.14)`;
      ctx.lineWidth = 1;
      for (const [a, b] of lines) {
        ctx.beginPath();
        ctx.moveTo(a.wx - cam.x, a.wy - cam.y);
        ctx.lineTo(b.wx - cam.x, b.wy - cam.y);
        ctx.stroke();
      }

      for (const s of stars) {
        const sx = s.wx - cam.x;
        const sy = s.wy - cam.y;
        if (sx < -60 || sx > w + 60 || sy < -60 || sy > h + 60) continue;
        const active = s.id === sel || s.id === hoverId;
        const tw = motion ? 0.8 + 0.2 * Math.sin((t / 1000) * 0.9 + s.p) : 1;
        const glowR = s.r * (active ? 9 : 6);
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        g.addColorStop(0, `rgba(${GOLD_RGB},${0.55 * tw})`);
        g.addColorStop(1, `rgba(${GOLD_RGB},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, glowR, 0, TAU);
        ctx.fill();

        ctx.fillStyle = COLORS.ivory;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r * (active ? 1.3 : 1), 0, TAU);
        ctx.fill();

        if (s.id === sel) {
          ctx.strokeStyle = COLORS.gold;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sx, sy, s.r + 7, 0, TAU);
          ctx.stroke();
        }
      }

      if (canPan && stars.length > 0) drawMinimap(sel);
    };

    /** Bila reduced-motion tidak ada loop, jadi gambar ulang manual setiap kamera berubah. */
    const requestDraw = () => {
      if (motionQuery.matches) draw(0);
    };

    const step = (t: number, dt: number) => {
      if (fly) {
        fly.start ??= t;
        const p = (t - fly.start) / FLY_MS;
        const e = easeOutCubic(p);
        cam.x = fly.from.x + (fly.to.x - fly.from.x) * e;
        cam.y = fly.from.y + (fly.to.y - fly.from.y) * e;
        if (p >= 1) {
          const id = fly.id;
          fly = null;
          live.current.onArrive(id);
        }
        return;
      }
      if (drag) return;
      if (Math.abs(vel.x) > 8 || Math.abs(vel.y) > 8) {
        cam.x += (vel.x * dt) / 1000;
        cam.y += (vel.y * dt) / 1000;
        const bx = cam.x;
        const by = cam.y;
        clamp();
        if (cam.x !== bx) vel.x = 0;
        if (cam.y !== by) vel.y = 0;
        const k = Math.exp((-dt / 1000) * 4); // gesekan: meluncur lalu berhenti
        vel.x *= k;
        vel.y *= k;
      } else {
        vel.x = 0;
        vel.y = 0;
      }
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = prevT ? Math.min(t - prevT, 64) : 16;
      prevT = t;
      step(t, dt);
      if (lowPower && t - last < 50) return; // ~20 fps di perangkat lemah
      last = t;
      draw(t);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      prevT = 0;
      if (motionQuery.matches) draw(0);
      else raf = requestAnimationFrame(frame);
    };
    redraw.current = requestDraw;

    api.current = {
      panBy(dx, dy) {
        fly = null;
        vel.x = 0;
        vel.y = 0;
        cam.x += dx;
        cam.y += dy;
        clamp();
        requestDraw();
      },
      flyTo(id) {
        const s = stars.find((x) => x.id === id);
        if (!s) return false;
        const to = centerOn({ x: s.wx, y: s.wy }, { w, h }, WORLD);
        vel.x = 0;
        vel.y = 0;
        if (motionQuery.matches) {
          cam.x = to.x;
          cam.y = to.y;
          draw(0);
          live.current.onArrive(id);
        } else {
          fly = { id, from: { x: cam.x, y: cam.y }, to, start: null };
        }
        return true;
      },
    };

    const hit = (clientX: number, clientY: number): string | null => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      let best: string | null = null;
      let bestD = HIT_RADIUS;
      for (const s of stars) {
        const d = Math.hypot(s.wx - cam.x - x, s.wy - cam.y - y);
        if (d < bestD) {
          bestD = d;
          best = s.id;
        }
      }
      return best;
    };

    const onDown = (e: PointerEvent) => {
      if (!live.current.interactive || (e.pointerType === 'mouse' && e.button !== 0)) return;
      canvas.setPointerCapture(e.pointerId);
      fly = null;
      vel.x = 0;
      vel.y = 0;
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, lastT: e.timeStamp, moved: false };
    };
    const onMove = (e: PointerEvent) => {
      if (!live.current.interactive) return;
      if (drag && e.pointerId === drag.id) {
        const dx = e.clientX - drag.sx;
        const dy = e.clientY - drag.sy;
        if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
          drag.moved = true;
          canvas.style.cursor = 'grabbing';
        }
        if (drag.moved) {
          const px = cam.x;
          const py = cam.y;
          cam.x = drag.cx - dx;
          cam.y = drag.cy - dy;
          clamp();
          const dt = Math.max(e.timeStamp - drag.lastT, 1);
          drag.lastT = e.timeStamp;
          // Kecepatan terhaluskan untuk gerak meluncur saat dilepas.
          vel.x = vel.x * 0.5 + (((cam.x - px) / dt) * 1000) * 0.5;
          vel.y = vel.y * 0.5 + (((cam.y - py) / dt) * 1000) * 0.5;
          requestDraw();
        }
        return;
      }
      if (e.pointerType !== 'mouse') return;
      const id = hit(e.clientX, e.clientY);
      if (id !== live.current.hoverId) {
        live.current.hoverId = id;
        canvas.style.cursor = id ? 'pointer' : 'grab';
        requestDraw();
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const wasTap = !drag.moved;
      drag = null;
      canvas.style.cursor = live.current.hoverId ? 'pointer' : 'grab';
      if (wasTap) {
        const id = hit(e.clientX, e.clientY);
        if (id) live.current.onSelect(id);
      } else if (motionQuery.matches) {
        vel.x = 0;
        vel.y = 0;
      }
    };
    const onCancel = () => {
      drag = null;
      vel.x = 0;
      vel.y = 0;
    };
    const onWheel = (e: WheelEvent) => {
      if (!live.current.interactive) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : 1;
      api.current?.panBy(e.deltaX * unit, e.deltaY * unit);
    };

    layout();
    start();
    void document.fonts?.ready.then(requestDraw);
    const ro = new ResizeObserver(() => {
      layout();
      start();
    });
    ro.observe(canvas);
    motionQuery.addEventListener('change', start);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      redraw.current = null;
      api.current = null;
      ro.disconnect();
      motionQuery.removeEventListener('change', start);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [messages]);

  useEffect(() => {
    if (!target) return;
    // Tanpa canvas/ konteks 2D, langsung "sampai" agar dialog tetap terbuka.
    if (!api.current?.flyTo(target.id)) live.current.onArrive(target.id);
  }, [target]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return;
    const step = e.shiftKey ? PAN_STEP * 3 : PAN_STEP;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    api.current?.panBy(m[0], m[1]);
  }

  return (
    <div
      role={interactive ? 'group' : undefined}
      aria-label={interactive ? 'Peta langit. Gunakan tombol panah untuk menggeser.' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={onKeyDown}
      className="h-full w-full focus-visible:outline-offset-[-4px]"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
    </div>
  );
}
