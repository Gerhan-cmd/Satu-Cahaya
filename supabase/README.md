# Backend Satu Cahaya (Supabase)

Status verifikasi: migrasi + RLS **diuji pada Postgres 16 lokal** (`tests/run.sh`) dengan peran dan `auth.uid()`
yang disimulasikan. Edge Functions diuji lewat unit test (dependensi diinjeksi). **Belum dijalankan terhadap proyek
Supabase sungguhan** (PostgREST, Auth, runtime Deno). Lakukan uji integrasi manual sebelum rilis.

## Arsitektur singkat
- Publik (anon) hanya bisa `select` kolom `id, body, category, published_at, is_demo` dari pesan `approved` (RLS + column grant).
- Kirim pesan dan lapor: Edge Function `submit-message` / `report-message` (service role, validasi, rate limit).
- Terima pesan: RPC `receive_message(p_exclude)`; acak, bukan deterministik.
- Moderasi: fungsi `moderation_queue`, `moderate_message`, `pending_reports`, `review_report`; semuanya memeriksa tabel `moderators`.
  Perubahan status dicatat otomatis di `moderation_events` oleh trigger, juga bila diubah lewat dashboard.

## Setup
1. `supabase link --project-ref <ref>` lalu `supabase db push` (menerapkan `migrations/`).
2. Secrets Edge Functions (jangan diberi prefix `VITE_`):
   `supabase secrets set RATE_LIMIT_SALT=<acak panjang> ALLOWED_ORIGINS=https://domainmu,http://localhost:5173`
3. `supabase functions deploy submit-message report-message`
4. Frontend: isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (lihat `.env.example`).

## Moderator pertama
1. Daftarkan akun (Auth > Users > Add user) dan salin `id`-nya.
2. Di SQL Editor: `insert into public.moderators (user_id) values ('<uuid>');`
3. MVP: moderasi dari SQL Editor/Table Editor (jalan sebagai superuser; trigger tetap mencatat audit):
   `update public.messages set status='approved' where id='<uuid>';`
   Moderator yang login bisa memakai RPC `moderate_message`. Antarmuka moderator belum ada.

## Pemeliharaan
- Jadwalkan pembersihan (pg_cron): `select cron.schedule('purge-rate-limit', '17 3 * * *', 'select public.purge_rate_limit_events()');`
- Hapus pesan atas permintaan: `delete from public.messages where id='<uuid>';` (laporan dan audit ikut terhapus).

## Menjalankan uji database
`ADMIN_URL=postgresql://postgres:<pw>@localhost:5432/postgres sh supabase/tests/run.sh`
(membuat database `satu_cahaya_test`; jangan arahkan ke database produksi).

## Keterbatasan
- Rate limit berbasis IP (HMAC): pengguna di balik NAT yang sama berbagi kuota, dan penyerang dengan banyak IP bisa lolos.
  CAPTCHA/Turnstile belum dipasang. Header IP bergantung pada infrastruktur Supabase.
- Filter tautan hanya heuristik; moderasi manusia tetap wajib. Kapasitas moderasi harus tumbuh bersama trafik.
- Pengecualian "pesan sendiri" hanya per perangkat (ID di localStorage); tidak ada identitas lintas perangkat.
- `receive_message` memakai `order by random()`: cukup untuk ribuan pesan; ganti ke strategi offset bila membesar.
- Beranda memuat maksimal 300 pesan terbaru.
