# Arsitektur

## Gambaran
```
Browser (React SPA, Canvas starfield)
  ├─ MessageRepository (antarmuka)
  │    ├─ demoRepository      → pesan contoh + localStorage   (tanpa env)
  │    └─ supabaseRepository  → supabase-js (dimuat lazy)
  └─ localStorage: favorit, refleksi, ID pesan sendiri

Supabase
  ├─ PostgREST: select kolom publik messages (RLS: status = approved)
  ├─ RPC receive_message (anon)           ← terima satu cahaya, acak
  ├─ Edge Function submit-message         ← validasi + rate limit + insert pending (service role)
  ├─ Edge Function report-message         ← validasi + rate limit + insert report
  └─ RPC moderator (authenticated + tabel moderators): antrean, moderasi, laporan
```

## Keputusan utama dan trade-off
- **Peta langit**: dunia 3200×2000 px dengan kamera yang digeser (drag/sentuh/roda/panah), luncuran berinersia, terbang ke bintang, dan minimap. Bintang latar memakai dua lapisan parallax yang menyambung. Matematika kamera ada di `lib/camera.ts` (teruji). Tata letak bintang pesan (`layoutStars`) deterministik dengan jarak minimum 44 px.
- **Rasi bintang latar**: data di `lib/constellations.ts` (bentuk bergaya, bukan peta astronomi presisi), digambar dengan parallax 0,35 di bawah bintang pesan. Murni dekoratif, tidak masuk hit-test, dan ditempatkan tanpa tumpang tindih (teruji pada lima ukuran viewport).
- **Intro**: SVG vektor hitam-putih (geometri di `lib/logoGeometry.ts`, dipakai juga oleh `scripts/build-logo.ts` untuk `public/logo.svg`/favicon). Animasi murni CSS keyframes dengan penundaan per elemen; tanpa library. Tampil sekali per sesi tab (`sessionStorage`), isi aplikasi `inert` selama intro, dapat dilewati, dan menghormati reduced-motion.
- **Canvas 2D, bukan Three.js**: cukup untuk ratusan bintang, bundle kecil. Partikel dikurangi di layar kecil/CPU ≤ 4 inti, ~20 fps di perangkat lemah, statis saat reduced-motion.
- **Repository + dua implementasi**: demo dan Supabase berbagi antarmuka; UI tidak tahu backend mana yang aktif.
- **Penulisan hanya lewat Edge Function**: anon tidak punya hak insert, sehingga rate limit dan validasi tidak bisa dilewati. Biayanya satu hop tambahan.
- **Baca lewat RLS + column grant** (bukan view): kolom `status` dan `moderation_reason` tidak bisa dibaca anon sama sekali.
- **Moderasi lewat fungsi security definer** yang memeriksa `moderators`: tidak ada URL admin tersembunyi; otorisasi ada di database.
- **Audit via trigger**: perubahan status tercatat walau dilakukan dari dashboard.
- **Validasi ganda**: klien (UX), Edge Function (otoritatif), constraint SQL (lapisan terakhir). Paritas klien-server dijaga tes.
- **Terima pesan di RPC**: `order by random()` agar tidak deterministik; cukup untuk ribuan baris.
- **Pesan sendiri**: ID disimpan di localStorage dan dikirim sebagai daftar pengecualian. Tidak ada identitas lintas perangkat (lihat keterbatasan).
- **Pesan kurasi** dipakai hanya bila tidak ada pesan komunitas yang eligible, dan selalu berlabel.

## Model data
| Tabel | Tujuan | Akses |
|---|---|---|
| `messages` | Pesan + status moderasi | anon/authenticated: select `id, body, category, published_at, is_demo` baris approved. Tulis: service role/trigger |
| `moderators` | Siapa yang boleh moderasi | tertutup; diisi pemilik proyek |
| `moderation_events` | Jejak audit (trigger) | tertutup; cascade bila pesan dihapus |
| `reports` | Laporan pengunjung | tertutup; insert via Edge Function |
| `rate_limit_events` | Rate limit (HMAC IP) | tertutup; dibersihkan berkala |

Publik: `id, body, category, published_at, is_demo`. Terbatas: `status, moderation_reason, created_at`, semua tabel lain.

## Struktur kode
```
src/lib/        validasi, repository (demo/supabase), pick, receive, favorit, refleksi, kartu, tokens
src/components/ Starfield, Landing, Composer, Reveal, MessageDialog, CardDialog, ReportDialog, ReflectionPad, SavedList
supabase/       migrations, functions (_shared/handlers diuji tanpa Deno), tests (SQL), seed (hanya lokal)
e2e/            Playwright
```

## Penanganan state asinkron
Setiap alur punya state loading, error (dengan coba lagi), kosong, dan sukses. Sukses hanya ditampilkan setelah server
mengonfirmasi (`submit` dan `report` memvalidasi bentuk respons).
