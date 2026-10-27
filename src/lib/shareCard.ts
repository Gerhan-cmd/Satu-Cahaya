import { hashString, mulberry32 } from './prng';
import { COLORS, GOLD_RGB } from './tokens';
import type { Message } from './types';
import { CATEGORY_LABEL } from './validation';

/** Bungkus teks per kata; kata yang lebih lebar dari batas dipecah per karakter. */
export function wrapLines(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    if (para.trim() === '') {
      out.push('');
      continue;
    }
    let line = '';
    for (const word of para.split(/\s+/)) {
      let w = word;
      if (measure(w) > maxWidth) {
        if (line) out.push(line);
        line = '';
        let piece = '';
        for (const ch of w) {
          if (measure(piece + ch) > maxWidth && piece) {
            out.push(piece);
            piece = ch;
          } else piece += ch;
        }
        w = piece;
        line = w;
        continue;
      }
      const test = line ? `${line} ${w}` : w;
      if (measure(test) <= maxWidth) line = test;
      else {
        out.push(line);
        line = w;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

const W = 1080;
const H = 1350;
const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = 'Inter, system-ui, sans-serif';

async function fontsReady(): Promise<void> {
  try {
    await Promise.race([
      document.fonts.load(`500 48px ${SERIF}`),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    /* pakai font cadangan */
  }
}

/** Kartu PNG 1080x1350. Hanya berisi teks pesan, kategori, dan nama produk. */
export async function renderCardBlob(m: Pick<Message, 'id' | 'body' | 'category'>): Promise<Blob> {
  await fontsReady();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia');

  const bg = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H);
  bg.addColorStop(0, '#101C32');
  bg.addColorStop(0.7, '#07111F');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const rnd = mulberry32(hashString(m.id));
  ctx.fillStyle = COLORS.ivory;
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = 0.15 + rnd() * 0.5;
    ctx.beginPath();
    ctx.arc(rnd() * W, rnd() * H, 0.8 + rnd() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const glow = ctx.createRadialGradient(W / 2, 290, 0, W / 2, 290, 230);
  glow.addColorStop(0, `rgba(${GOLD_RGB},0.6)`);
  glow.addColorStop(1, `rgba(${GOLD_RGB},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(W / 2, 290, 230, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.ivory;
  ctx.beginPath();
  ctx.arc(W / 2, 290, 12, 0, Math.PI * 2);
  ctx.fill();

  const maxW = W - 220;
  const maxH = 520;
  let size = 64;
  let lines: string[] = [];
  for (const s of [64, 56, 50, 44, 40, 36, 32]) {
    size = s;
    ctx.font = `500 ${s}px ${SERIF}`;
    lines = wrapLines(m.body, maxW, (t) => ctx.measureText(t).width);
    if (lines.length * s * 1.35 <= maxH) break;
  }
  const lineH = size * 1.35;
  const top = 520 + (maxH - lines.length * lineH) / 2;
  ctx.fillStyle = COLORS.ivory;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lineH));

  ctx.fillStyle = '#A9B5C8';
  ctx.font = `500 30px ${SANS}`;
  ctx.fillText(CATEGORY_LABEL[m.category], W / 2, 1090);
  ctx.fillStyle = COLORS.gold;
  ctx.font = `500 52px ${SERIF}`;
  ctx.fillText('Satu Cahaya', W / 2, 1190);
  ctx.fillStyle = '#A9B5C8';
  ctx.font = `400 26px ${SANS}`;
  ctx.fillText('Leave One Light. Receive Another.', W / 2, 1258);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal membuat gambar'))), 'image/png'),
  );
}
