// Membuat public/logo.svg (bingkai akhir logo, hitam-putih) dari geometri yang sama dengan intro.
// Jalankan: node scripts/build-logo.ts
import { writeFileSync } from 'node:fs';
import { DOME, DOTS, FIGURE_BODY, FIGURE_HEAD, HILL, RAYS, RAY_ORIGIN, STAR, STAR_PATH } from '../src/lib/logoGeometry.ts';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="Satu Cahaya">
  <defs>
    <clipPath id="dome"><path d="${DOME}"/></clipPath>
    <linearGradient id="domeFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".6" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".02"/>
    </linearGradient>
    <linearGradient id="rayFill" gradientUnits="userSpaceOnUse" x1="${RAY_ORIGIN.x}" y1="${RAY_ORIGIN.y}" x2="${RAY_ORIGIN.x}" y2="330">
      <stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="400" height="400" rx="72" fill="#000"/>
  <path d="${DOME}" fill="url(#domeFill)"/>
  <g clip-path="url(#dome)" fill="url(#rayFill)">${RAYS.map((r) => `<path d="${r.path}"/>`).join('')}</g>
  <circle cx="${STAR.x}" cy="${STAR.y}" r="52" fill="url(#glow)"/>
  <path d="${STAR_PATH}" fill="#fff"/>
  <path d="${HILL}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="${FIGURE_HEAD.cx}" cy="${FIGURE_HEAD.cy}" r="${FIGURE_HEAD.r}" fill="#fff"/>
  <path d="${FIGURE_BODY}" fill="#fff"/>
  ${DOTS.map((d) => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="#fff"/>`).join('\n  ')}
</svg>
`;
writeFileSync(new URL('../public/logo.svg', import.meta.url), svg);
console.log('public/logo.svg ditulis');
