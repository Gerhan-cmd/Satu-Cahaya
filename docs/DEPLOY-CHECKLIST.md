# Checklist deploy

Belum ada deploy yang dilakukan atau diverifikasi.

## Supabase
- [ ] Proyek dibuat; `supabase link --project-ref <ref>`
- [ ] `supabase db push` sukses; tabel dan fungsi ada
- [ ] RLS aktif pada kelima tabel (Dashboard > Database > Tables)
- [ ] Verifikasi dengan anon key: `select * from messages` hanya baris approved; `moderation_reason` ditolak
- [ ] `supabase secrets set RATE_LIMIT_SALT=... ALLOWED_ORIGINS=https://domainmu`
- [ ] `supabase functions deploy submit-message report-message`
- [ ] Uji: kirim pesan valid (201 pending), tidak valid (400), kirim berulang (429), laporan pesan non-publik (404)
- [ ] Moderator pertama dibuat (lihat `supabase/README.md`)
- [ ] pg_cron `purge_rate_limit_events` dijadwalkan
- [ ] Service-role key tidak ada di repo, `.env`, atau frontend (`git grep -i service_role`)
- [ ] Backup/PITR sesuai paket

## Frontend (Vercel)
- [ ] Env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` di dashboard Vercel
- [ ] Build `npm run build`, output `dist`
- [ ] `vercel.json`: header keamanan aktif; CSP masih report-only. Amati konsol, lalu ubah ke `Content-Security-Policy` bila bersih
- [ ] Domain produksi ada di `ALLOWED_ORIGINS`
- [ ] Badge "Mode demo" **tidak** tampil di produksi
- [ ] Lighthouse mobile: performa/aksesibilitas dicatat

## Sebelum publik
- [ ] `docs/QA-CHECKLIST.md` selesai
- [ ] Rencana moderasi: siapa, jam berapa, SLA; antrean dipantau harian
- [ ] Halaman/teks privasi sesuai perilaku nyata (retensi, cara minta hapus pesan)
- [ ] Tes beban ringan pada Edge Function dan batas Supabase free tier diperiksa
