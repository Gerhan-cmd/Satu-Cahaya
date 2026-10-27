-- Uji otorisasi dan RLS. Dijalankan sebagai superuser; tiap blok berganti peran.
-- Kegagalan = exception 'GAGAL: ...' dan psql berhenti dengan status non-nol.

-- Seed (superuser)
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000a1'),  -- moderator
  ('00000000-0000-0000-0000-0000000000a2');  -- pengguna biasa
insert into public.moderators (user_id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.messages (id, body, category, status) values
  ('10000000-0000-0000-0000-000000000001', 'Pesan pertama yang sudah disetujui untuk uji', 'harapan', 'approved'),
  ('10000000-0000-0000-0000-000000000002', 'Pesan kedua yang masih menunggu ditinjau ya', 'syukur', 'pending'),
  ('10000000-0000-0000-0000-000000000003', 'Pesan ketiga yang ditolak oleh moderator ya', 'bebas', 'rejected');

-- ===== anon =====
set role anon;
do $$
declare n int;
begin
  select count(*) into n from public.messages;
  if n <> 1 then raise exception 'GAGAL: anon melihat % pesan, seharusnya 1 (approved)', n; end if;

  begin perform moderation_reason from public.messages; raise exception 'GAGAL: anon bisa membaca moderation_reason';
  exception when insufficient_privilege then null; end;
  begin perform status from public.messages; raise exception 'GAGAL: anon bisa membaca status';
  exception when insufficient_privilege then null; end;
  begin insert into public.messages (body, category) values ('Pesan yang dicoba dimasukkan oleh anon', 'bebas'); raise exception 'GAGAL: anon bisa insert';
  exception when insufficient_privilege then null; end;
  begin update public.messages set status = 'approved'; raise exception 'GAGAL: anon bisa update';
  exception when insufficient_privilege then null; end;
  begin delete from public.messages; raise exception 'GAGAL: anon bisa delete';
  exception when insufficient_privilege then null; end;

  begin perform 1 from public.reports; raise exception 'GAGAL: anon membaca reports';
  exception when insufficient_privilege then null; end;
  begin insert into public.reports (message_id, reason) values ('10000000-0000-0000-0000-000000000001', 'spam'); raise exception 'GAGAL: anon bisa insert reports';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.moderation_events; raise exception 'GAGAL: anon membaca moderation_events';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.moderators; raise exception 'GAGAL: anon membaca moderators';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.rate_limit_events; raise exception 'GAGAL: anon membaca rate_limit_events';
  exception when insufficient_privilege then null; end;

  begin perform public.moderate_message('10000000-0000-0000-0000-000000000002', 'approved'); raise exception 'GAGAL: anon bisa moderate';
  exception when insufficient_privilege then null; end;
  begin perform * from public.moderation_queue(); raise exception 'GAGAL: anon bisa membaca antrean';
  exception when insufficient_privilege then null; end;
  begin perform public.check_rate_limit('x', 'k', 1, 60); raise exception 'GAGAL: anon bisa memanggil check_rate_limit';
  exception when insufficient_privilege then null; end;

  -- receive_message boleh untuk anon
  select count(*) into n from public.receive_message('{}');
  if n <> 1 then raise exception 'GAGAL: receive_message anon mengembalikan % baris', n; end if;
  select count(*) into n from public.receive_message(array['10000000-0000-0000-0000-000000000001']::uuid[]);
  if n <> 0 then raise exception 'GAGAL: receive_message tidak menghormati exclude'; end if;
  -- pesan pending/rejected tidak pernah dikembalikan
  for i in 1..50 loop
    select count(*) into n from public.receive_message('{}') r where r.id <> '10000000-0000-0000-0000-000000000001';
    if n <> 0 then raise exception 'GAGAL: receive_message membocorkan pesan non-approved'; end if;
  end loop;
end $$;
reset role;

-- ===== pengguna login non-moderator =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a2', false);
set role authenticated;
do $$
declare n int;
begin
  select count(*) into n from public.messages;
  if n <> 1 then raise exception 'GAGAL: authenticated non-moderator melihat % pesan', n; end if;
  begin perform public.moderate_message('10000000-0000-0000-0000-000000000002', 'approved'); raise exception 'GAGAL: non-moderator bisa moderate';
  exception when insufficient_privilege then null; end;
  begin perform * from public.moderation_queue(); raise exception 'GAGAL: non-moderator bisa membaca antrean';
  exception when insufficient_privilege then null; end;
  begin perform * from public.pending_reports(); raise exception 'GAGAL: non-moderator bisa membaca laporan';
  exception when insufficient_privilege then null; end;
  begin update public.messages set status = 'approved'; raise exception 'GAGAL: authenticated bisa update langsung';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ===== service role =====
set role service_role;
do $$
declare ok boolean; msg uuid;
begin
  insert into public.messages (body, category) values ('Pesan baru dari Edge Function untuk diuji', 'semangat') returning id into msg;
  if (select status from public.messages where id = msg) <> 'pending' then raise exception 'GAGAL: pesan baru tidak pending'; end if;

  begin insert into public.messages (body, category) values ('pendek', 'bebas'); raise exception 'GAGAL: pesan pendek diterima';
  exception when check_violation then null; end;
  begin insert into public.messages (body, category) values (repeat('a', 401), 'bebas'); raise exception 'GAGAL: pesan panjang diterima';
  exception when check_violation then null; end;
  begin insert into public.messages (body, category) values ('Kunjungi https://contoh.com untuk info ya', 'bebas'); raise exception 'GAGAL: tautan diterima';
  exception when check_violation then null; end;
  begin insert into public.messages (body, category) values ('Pesan dengan kategori yang tidak dikenal', 'lain'); raise exception 'GAGAL: kategori salah diterima';
  exception when check_violation then null; end;
  begin insert into public.messages (body, category) values ('  Pesan dengan spasi di tepi yang panjang  ', 'bebas'); raise exception 'GAGAL: spasi tepi diterima';
  exception when check_violation then null; end;

  insert into public.reports (message_id, reason) values ('10000000-0000-0000-0000-000000000001', 'spam');
  begin insert into public.reports (message_id, reason) values ('10000000-0000-0000-0000-000000000001', 'asal'); raise exception 'GAGAL: alasan laporan salah diterima';
  exception when check_violation then null; end;

  -- rate limit: 3 diizinkan, ke-4 ditolak, kunci lain tidak terpengaruh
  for i in 1..3 loop
    select public.check_rate_limit('submit', 'key-a', 3, 3600) into ok;
    if not ok then raise exception 'GAGAL: permintaan % seharusnya diizinkan', i; end if;
  end loop;
  select public.check_rate_limit('submit', 'key-a', 3, 3600) into ok;
  if ok then raise exception 'GAGAL: permintaan ke-4 seharusnya ditolak'; end if;
  select public.check_rate_limit('submit', 'key-b', 3, 3600) into ok;
  if not ok then raise exception 'GAGAL: kunci lain ikut terblokir'; end if;
end $$;
reset role;

-- ===== moderator =====
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
set role authenticated;
do $$
declare n int; pending_id uuid := '10000000-0000-0000-0000-000000000002';
begin
  select count(*) into n from public.moderation_queue('pending');
  if n < 2 then raise exception 'GAGAL: antrean moderator hanya % pesan', n; end if;

  perform public.moderate_message(pending_id, 'approved', 'layak tampil');
  if (select published_at from public.messages where id = pending_id) is null then
    raise exception 'GAGAL: published_at tidak terisi saat approve'; end if;

  begin perform public.moderate_message(pending_id, 'pending'); raise exception 'GAGAL: status pending diterima';
  exception when invalid_parameter_value then null; end;
  begin perform public.moderate_message(gen_random_uuid(), 'approved'); raise exception 'GAGAL: id tak dikenal diterima';
  exception when no_data_found then null; end;

  perform public.moderate_message(pending_id, 'removed', 'dihapus setelah laporan');
  select count(*) into n from public.pending_reports();
  if n <> 1 then raise exception 'GAGAL: pending_reports mengembalikan % baris', n; end if;
end $$;
reset role;

-- Jejak audit & integritas (superuser)
do $$
declare n int;
begin
  select count(*) into n from public.moderation_events
  where message_id = '10000000-0000-0000-0000-000000000002'
    and moderator_id = '00000000-0000-0000-0000-0000000000a1';
  if n <> 2 then raise exception 'GAGAL: moderation_events berisi % baris, seharusnya 2', n; end if;

  begin update public.messages set body = 'Isi pesan yang diubah setelah dipublikasikan' where id = '10000000-0000-0000-0000-000000000001';
    raise exception 'GAGAL: body bisa diubah';
  exception when insufficient_privilege then null; end;
  begin update public.messages set status = 'pending' where id = '10000000-0000-0000-0000-000000000001';
    raise exception 'GAGAL: status bisa dikembalikan ke pending';
  exception when check_violation then null; end;

  -- pesan yang sudah removed tidak lagi terlihat publik
  perform set_config('request.jwt.claim.sub', '', false);
end $$;
set role anon;
do $$
begin
  if exists (select 1 from public.messages where id = '10000000-0000-0000-0000-000000000002') then
    raise exception 'GAGAL: pesan removed masih terlihat publik'; end if;
end $$;
reset role;

select 'SEMUA UJI RLS LULUS' as hasil;
