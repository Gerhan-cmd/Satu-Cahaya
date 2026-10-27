# Keterbatasan dan rencana lanjutan

## Keterbatasan yang diketahui
- **Pesan sendiri hanya dikecualikan per perangkat.** ID disimpan di localStorage; hilang bila data browser dihapus dan tidak berlaku lintas perangkat. Tanpa akun, identitas lintas perangkat tidak mungkin dijamin.
- **Rate limit berbasis IP (HMAC).** Pengguna di balik NAT berbagi kuota; penyerang dengan banyak IP bisa lolos. Belum ada CAPTCHA/Turnstile. Header IP bergantung infrastruktur Supabase.
- **Filter tautan hanya heuristik.** Moderasi manusia wajib; kapasitas moderasi harus tumbuh bersama trafik.
- **Belum ada antarmuka moderator.** MVP memakai dashboard/SQL Editor; RPC moderator sudah ada dan teruji di database.
- **Data lokal rapuh.** Favorit, refleksi, dan ID pesan sendiri hilang bila data browser dihapus atau penyimpanan diblokir.
- **`receive_message` memakai `order by random()`**: baik untuk ribuan pesan, perlu strategi lain bila membesar.
- **Peta belum mendukung zoom**; dunia berukuran tetap sehingga kepadatan bintang naik bila pesan sangat banyak (di atas ratusan).
- **Langit memuat maksimal 300 pesan terbaru**; pesan lama tetap bisa diterima lewat "terima cahaya".
- **Font dari Google Fonts** (ada request pihak ketiga); self-host bila privasi ketat dibutuhkan.
- **Rasi bintang bergaya**: bentuk disederhanakan dan penempatannya tidak mengikuti posisi astronomi sebenarnya. Konten dekoratif; tidak dimaksudkan sebagai peta langit.
- **Web Share file** tidak tersedia di semua browser; fallback unduh.
- **Belum diverifikasi di browser nyata dan terhadap Supabase sungguhan** (lihat README).

## Rencana lanjutan
- Panel moderator (login Supabase + antrean + laporan)
- Turnstile/CAPTCHA dan deteksi spam yang lebih baik
- Laporan otomatis menyembunyikan sementara bila melewati ambang (dengan perlindungan penyalahgunaan)
- Self-host font; CSP enforce
- Realtime hanya bila benar-benar diimplementasikan (saat ini tidak ada klaim aktivitas langsung)
- Internasionalisasi (Inggris)
