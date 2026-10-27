# Satu Cahaya — Leave One Light. Receive Another.

*Nyalakan satu harapan. Terima satu cahaya.*

Pengalaman web Natal: tinggalkan satu pesan harapan anonim, lalu terima satu pesan dari orang lain. Setiap pesan yang
disetujui moderator menjadi bintang di langit bersama. React + TypeScript + Vite + Tailwind; backend Supabase.

> Bukan layanan konseling atau terapi, dan bukan pengganti hubungan dengan orang-orang terdekat.

## Status verifikasi (jujur)

| Area | Status |
|---|---|
| Typecheck, lint, build | Dijalankan, lulus |
| Tes unit/komponen (Vitest, 69 tes) | Dijalankan, lulus |
| Migrasi + RLS + otorisasi | Dijalankan pada Postgres 16 lokal dengan peran Supabase simulasi, lulus |
| Edge Functions | `deno check` lulus; logika diuji dengan dependensi palsu |
| Tes E2E Playwright (14 tes, termasuk axe) | **Ditulis, belum pernah dijalankan** (browser tidak tersedia di lingkungan pengembangan) |
| Layout 360–1440px, performa, keyboard di browser nyata | **Belum diuji**; ikuti `docs/QA-CHECKLIST.md` |
| Integrasi dengan proyek Supabase sungguhan | **Belum dijalankan** |
| Deploy ke Vercel | **Belum dilakukan** |

## Mulai cepat (mode demo, tanpa Supabase)

```bash
npm install
npm run dev          # http://localhost:5173
```
Tanpa `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`, aplikasi berjalan dalam **mode demo**: 12 pesan contoh berlabel,
kiriman dan laporan hanya di localStorage perangkat ini. Header menampilkan badge "Mode demo".

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` / `npm run build` | Pengembangan / build produksi |
| `npm run lint` | oxlint |
| `npm test` | Vitest (unit, komponen, paritas klien-server, handler Edge Function) |
| `npm run test:db` | Uji migrasi dan RLS pada Postgres lokal (butuh `ADMIN_URL`, lihat `supabase/README.md`) |
| `npm run e2e` | Playwright (butuh `npx playwright install chromium`) |

## Konfigurasi

Salin `.env.example` ke `.env.local`. Variabel `VITE_*` terlihat publik di browser (anon/publishable key aman karena
dilindungi RLS). **Jangan pernah** menaruh service-role key di frontend atau memberinya prefix `VITE_`. Secret Edge
Function (`RATE_LIMIT_SALT`, `ALLOWED_ORIGINS`) diset lewat `supabase secrets set`.

## Menyambungkan Supabase

Ikuti `supabase/README.md`: push migrasi, set secrets, deploy dua Edge Function, buat moderator pertama.
Lalu isi env frontend. Repository berpindah otomatis dari demo ke Supabase tanpa mengubah UI.

## Deploy

Lihat `docs/DEPLOY-CHECKLIST.md`. Frontend statis (Vercel atau setara), backend di Supabase.

## Dokumentasi

- `docs/ARCHITECTURE.md`: arsitektur, alur data, model data, keputusan
- `docs/QA-CHECKLIST.md`: checklist QA manual
- `docs/DEPLOY-CHECKLIST.md`: checklist deploy
- `docs/LIMITATIONS.md`: keterbatasan dan rencana lanjutan
- `supabase/README.md`: backend, moderator pertama, pemeliharaan

## Privasi singkat

Tidak ada akun, nama, email, atau lokasi. Pesan ditinjau sebelum tampil. Refleksi pribadi dan favorit hanya di
browser (localStorage) dan tidak pernah dikirim. Rate limit memakai HMAC dari IP (IP asli tidak disimpan) dan dihapus
berkala. Prosedur penghapusan pesan ada di `supabase/README.md`.
