# Checklist QA manual

Belum ada hasil QA di browser yang tercatat. Centang setelah diuji sendiri. Uji di Chrome Android, Safari iOS, dan
desktop; lebar 360, 390, 768, 1024, 1440.

## Intro (hitam-putih)
- [ ] Urutan: bukit tergambar, sosok muncul, jejak titik satu per satu, bintang menyala, berkas cahaya melebar dari bintang, kubah terisi, judul + tagline naik
- [ ] Murni hitam-putih (tanpa warna); berkas cahaya mengembang dari titik bintang, bukan dari pojok
- [ ] Menutup sendiri ±6,4 detik lalu memudar ke situs; tidak berkedip/lompat
- [ ] Tombol "Lewati" terfokus saat muncul; Enter/Esc melewati; fokus tidak bisa masuk ke isi situs selama intro
- [ ] Tidak muncul lagi saat reload di tab yang sama; muncul lagi di tab/sesi baru
- [ ] Reduced-motion: langsung bingkai akhir, tombol "Masuk", tidak menutup sendiri
- [ ] 360px: logo dan teks tidak terpotong; tidak ada scroll
- [ ] Favicon (`/logo.svg`) tampil di tab browser

## Landing
- [ ] Tagline, intro Indonesia, dua CTA, penjelasan anonim/moderasi terlihat tanpa scroll berlebih di 360px
- [ ] "Nyalakan Cahaya" membuka alur menulis; "Jelajahi Langit" membuka langit
- [ ] Tidak ada scroll horizontal di semua lebar
- [ ] Badge "Mode demo" muncul hanya tanpa env Supabase

## Langit (peta yang bisa digeser)
- [ ] Geser dengan mouse (drag), sentuhan (satu jari), dan roda/trackpad; kursor berubah grab/grabbing/pointer
- [ ] Setelah dilepas, peta meluncur lalu berhenti; tidak keluar dari tepi dunia
- [ ] Mengetuk bintang membuka pesan; menggeser yang berawal di atas bintang TIDAK membukanya
- [ ] Panah keyboard menggeser peta (Shift = lebih jauh) saat grup "Peta langit" fokus
- [ ] "Cahaya acak" dan daftar "Baca bintang N": kamera terbang ke bintang lalu dialog terbuka
- [ ] Reduced-motion: tanpa luncuran/terbang (pindah instan), peta tetap bisa digeser
- [ ] Minimap (kanan atas) menunjukkan posisi jendela; tidak menutupi tombol di 360px
- [ ] Parallax: bintang latar bergeser lebih lambat dari bintang pesan
- [ ] Menggeser di layar sentuh tidak men-scroll halaman atau memicu pull-to-refresh
- [ ] CPU throttle 6x: geser tetap mulus

## Rasi bintang latar
- [ ] 12 zodiak + Orion, Biduk, Salib Selatan, Kasiopea tampak sebagai garis dan titik biru-abu redup, berlabel nama
- [ ] Rasi tidak bisa diklik/diketuk; mengetuk di atasnya tidak membuka apa pun
- [ ] Bedakan jelas dari bintang pesan (emas, lebih terang); teks landing tetap terbaca
- [ ] Rasi bergeser lebih lambat saat peta digeser (kesan jauh) dan tidak saling menumpuk di 360/768/1440px
- [ ] Label memakai font serif; tidak terpotong di tepi layar; reduced-motion tanpa kedip

## Langit (umum)
- [ ] Bintang beragam ukuran/kilau; posisi sama setelah reload
- [ ] Klik/tap bintang membuka dialog; Esc dan tombol Tutup menutupnya
- [ ] Tab menuju daftar "Baca bintang N" dan Enter membuka dialog
- [ ] "Cahaya acak" membuka pesan berbeda-beda
- [ ] State loading, error (matikan jaringan di mode Supabase) dan kosong tampil benar
- [ ] Pesan contoh berlabel; tidak ada angka/aktivitas palsu
- [ ] Throttle CPU 6x di DevTools: tetap responsif

## Menulis
- [ ] 5 kategori, prompt sesuai kategori
- [ ] <20 atau >400 karakter, tautan, dan karakter kontrol ditolak dengan pesan teks (bukan hanya warna)
- [ ] Pratinjau bintang; kirim menampilkan "menunggu ditinjau"
- [ ] Kirim gagal (offline) menampilkan error, bukan sukses
- [ ] Kirim berulang >3x/jam menampilkan pesan batas (mode Supabase)

## Terima cahaya
- [ ] Muncul setelah kirim; animasi tenang; reduced-motion = tanpa animasi
- [ ] Pesan sendiri tidak pernah muncul (kirim lalu terima berkali-kali)
- [ ] Tanpa pesan komunitas: pesan kurasi berlabel + ajakan refleksi
- [ ] Simpan, Cahaya lain, Kembali ke langit berfungsi

## Kartu bagikan
- [ ] PNG terbaca di ponsel; tidak ada data pengirim; teks panjang (400 karakter) muat
- [ ] Unduh bekerja; Bagikan hanya muncul bila didukung; fallback jelas
- [ ] Font serif termuat (atau cadangan Georgia rapi)

## Refleksi & tersimpan
- [ ] Refleksi tersimpan lokal, tidak ada request jaringan (DevTools > Network)
- [ ] Ekspor .txt benar; hapus bekerja; pesan peringatan data lokal terlihat
- [ ] Mode privat/penyimpanan diblokir: error jelas, tidak crash

## Laporan & moderasi (Supabase)
- [ ] Laporkan pesan publik → muncul di `reports`
- [ ] Pesan pending tidak terlihat anon (cek lewat anon key di curl/REST)
- [ ] Approve via dashboard → tampil sebagai bintang; remove → hilang; `moderation_events` terisi
- [ ] Non-moderator memanggil `moderate_message` → ditolak

## Aksesibilitas
- [ ] Seluruh alur dengan keyboard saja; fokus terlihat; fokus terkunci di dialog dan kembali saat ditutup
- [ ] Pembaca layar (TalkBack/VoiceOver): dialog dan status diumumkan; canvas tidak mengganggu
- [ ] Kontras teks ≥ 4.5:1 (periksa teks `mist` di atas langit)
- [ ] Target sentuh ≥ 44px; zoom 200% tanpa kehilangan fungsi
- [ ] `npm run e2e` (axe) tanpa pelanggaran serius

## Konsol & jaringan
- [ ] Tanpa error konsol; tanpa request ke domain tak terduga; CSP report-only bersih
