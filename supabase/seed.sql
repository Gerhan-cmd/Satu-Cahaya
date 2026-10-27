-- DATA DEMO UNTUK PENGEMBANGAN LOKAL SAJA (`supabase db reset`). JANGAN dijalankan di produksi.
-- Semua baris diberi is_demo = true sehingga UI menampilkannya sebagai "contoh pesan",
-- bukan kiriman pengunjung nyata.
insert into public.messages (body, category, status, is_demo) values
  ('Semoga ada satu hal kecil hari ini yang membuatmu tersenyum, bahkan kalau harimu terasa berat.', 'harapan', 'approved', true),
  ('Tahun ini aku belajar bersyukur untuk hal-hal sederhana: teh hangat, pesan dari teman lama, dan pagi yang tenang.', 'syukur', 'approved', true),
  ('Kamu tidak harus kuat setiap saat. Istirahat sebentar juga bagian dari perjalanan.', 'semangat', 'approved', true),
  ('Aku sedang belajar melepaskan hal-hal yang tidak bisa kuubah. Pelan-pelan, rasanya jadi lebih ringan.', 'pengampunan', 'approved', true),
  ('Untuk siapa pun yang merayakan Natal jauh dari rumah: semoga hangatnya tetap sampai padamu.', 'harapan', 'approved', true);
