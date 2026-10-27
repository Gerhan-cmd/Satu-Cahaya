-- Satu Cahaya: skema awal, RLS, dan fungsi backend.
-- Prinsip: anon hanya boleh MEMBACA kolom publik pesan yang berstatus approved.
-- Semua penulisan (kirim pesan, lapor, rate limit) lewat Edge Function dengan service role.
-- Moderasi lewat fungsi security definer yang memeriksa tabel moderators.

-- ===== Tabel =====

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  category text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  published_at timestamptz,
  moderation_reason text,
  -- true hanya untuk data demo lokal (supabase/seed.sql); UI menampilkannya sebagai contoh.
  is_demo boolean not null default false,
  constraint messages_body_len check (char_length(body) between 20 and 400),
  constraint messages_body_trimmed check (body = btrim(body)),
  -- Lapisan terakhir; filter tautan lengkap ada di Edge Function.
  constraint messages_body_no_link check (body !~* '(https?://|www\.)'),
  constraint messages_category_valid check (category in ('harapan', 'syukur', 'pengampunan', 'semangat', 'bebas')),
  constraint messages_status_valid check (status in ('pending', 'approved', 'rejected', 'removed')),
  constraint messages_published_when_approved check (status <> 'approved' or published_at is not null)
);

create index messages_approved_published_idx on public.messages (published_at desc) where status = 'approved';
create index messages_status_created_idx on public.messages (status, created_at);

-- Daftar moderator. Diisi manual oleh pemilik proyek (lihat supabase/README.md).
create table public.moderators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Jejak audit; diisi otomatis oleh trigger pada messages.
create table public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  action text not null,
  reason text,
  created_at timestamptz not null default now(),
  moderator_id uuid references auth.users (id) on delete set null,
  constraint moderation_events_action_valid check (action in ('approved', 'rejected', 'removed'))
);
create index moderation_events_message_idx on public.moderation_events (message_id, created_at);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  status text not null default 'pending',
  constraint reports_reason_valid check (reason in ('tidak_pantas', 'spam', 'data_pribadi', 'membahayakan', 'lainnya')),
  constraint reports_status_valid check (status in ('pending', 'reviewed'))
);
create index reports_status_created_idx on public.reports (status, created_at);
create index reports_message_idx on public.reports (message_id);

-- Rate limit. key_hash = HMAC dari IP dengan salt rahasia; IP asli tidak disimpan.
-- Baris dihapus oleh purge_rate_limit_events() (jadwalkan, lihat README).
create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  action text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_events_lookup_idx on public.rate_limit_events (action, key_hash, created_at);

-- ===== Hak akses & RLS =====

alter table public.messages enable row level security;
alter table public.moderators enable row level security;
alter table public.moderation_events enable row level security;
alter table public.reports enable row level security;
alter table public.rate_limit_events enable row level security;

-- Supabase memberi hak default ke anon/authenticated; cabut semuanya, lalu beri yang minimum.
revoke all on public.messages, public.moderators, public.moderation_events, public.reports, public.rate_limit_events
  from anon, authenticated;

-- Kolom publik saja. moderation_reason dan status tidak pernah dapat dibaca publik.
grant select (id, body, category, published_at, is_demo) on public.messages to anon, authenticated;

create policy messages_public_read on public.messages
  for select to anon, authenticated
  using (status = 'approved');

-- Tabel lain: RLS aktif tanpa policy untuk anon/authenticated = tertutup. Hanya service role
-- (bypass RLS) dan fungsi security definer di bawah yang menyentuhnya.

-- ===== Fungsi =====

create function public.is_moderator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.moderators m where m.user_id = auth.uid());
$$;

-- Menjaga integritas pesan dan mencatat jejak audit.
create function public.messages_before_insert() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'approved' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

create function public.messages_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.id is distinct from old.id
     or new.body is distinct from old.body
     or new.category is distinct from old.category
     or new.created_at is distinct from old.created_at then
    raise exception 'id, body, category, dan created_at tidak dapat diubah' using errcode = '42501';
  end if;
  if new.status is distinct from old.status then
    if new.status = 'pending' then
      raise exception 'pesan tidak dapat dikembalikan ke pending' using errcode = '23514';
    end if;
    if new.status = 'approved' then
      new.published_at := coalesce(old.published_at, now());
    end if;
    insert into public.moderation_events (message_id, action, reason, moderator_id)
    values (new.id, new.status, new.moderation_reason, auth.uid());
  end if;
  return new;
end $$;

create trigger messages_before_insert before insert on public.messages
  for each row execute function public.messages_before_insert();
create trigger messages_before_update before update on public.messages
  for each row execute function public.messages_before_update();

-- Satu pesan approved acak selain p_exclude. Tidak ada baris bila tidak ada yang eligible.
create function public.receive_message(p_exclude uuid[] default '{}')
returns table (id uuid, body text, category text, is_demo boolean)
language sql volatile security definer set search_path = '' as $$
  select m.id, m.body, m.category, m.is_demo
  from public.messages m
  where m.status = 'approved'
    and cardinality(coalesce(p_exclude, '{}')) <= 500
    and not (m.id = any (coalesce(p_exclude, '{}')))
  order by random()
  limit 1;
$$;

-- Fungsi moderator: semuanya memeriksa is_moderator() terhadap JWT pemanggil.
create function public.moderation_queue(p_status text default 'pending')
returns setof public.messages
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_moderator() then
    raise exception 'tidak diizinkan' using errcode = '42501';
  end if;
  return query select * from public.messages m where m.status = p_status order by m.created_at limit 100;
end $$;

create function public.moderate_message(p_id uuid, p_status text, p_reason text default null)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_moderator() then
    raise exception 'tidak diizinkan' using errcode = '42501';
  end if;
  if p_status not in ('approved', 'rejected', 'removed') then
    raise exception 'status tidak valid' using errcode = '22023';
  end if;
  update public.messages set status = p_status, moderation_reason = p_reason where id = p_id;
  if not found then
    raise exception 'pesan tidak ditemukan' using errcode = 'P0002';
  end if;
end $$;

create function public.pending_reports()
returns table (report_id uuid, message_id uuid, reason text, created_at timestamptz, message_body text, message_status text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_moderator() then
    raise exception 'tidak diizinkan' using errcode = '42501';
  end if;
  return query
    select r.id, r.message_id, r.reason, r.created_at, m.body, m.status
    from public.reports r join public.messages m on m.id = r.message_id
    where r.status = 'pending' order by r.created_at limit 100;
end $$;

create function public.review_report(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_moderator() then
    raise exception 'tidak diizinkan' using errcode = '42501';
  end if;
  update public.reports set status = 'reviewed' where id = p_id;
  if not found then
    raise exception 'laporan tidak ditemukan' using errcode = 'P0002';
  end if;
end $$;

-- Rate limit atomik per (action, key). Hanya untuk service role (Edge Function).
create function public.check_rate_limit(p_action text, p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_action || ':' || p_key, 0));
  select count(*) into n from public.rate_limit_events e
  where e.action = p_action and e.key_hash = p_key
    and e.created_at > now() - make_interval(secs => p_window_seconds);
  if n >= p_limit then
    return false;
  end if;
  insert into public.rate_limit_events (action, key_hash) values (p_action, p_key);
  return true;
end $$;

create function public.purge_rate_limit_events() returns void
language sql security definer set search_path = '' as $$
  delete from public.rate_limit_events where created_at < now() - interval '2 days';
$$;

-- Hak eksekusi: cabut dari semua, lalu beri sesuai peran.
revoke all on function
  public.is_moderator(), public.receive_message(uuid[]), public.moderation_queue(text),
  public.moderate_message(uuid, text, text), public.pending_reports(), public.review_report(uuid),
  public.check_rate_limit(text, text, int, int), public.purge_rate_limit_events(),
  public.messages_before_insert(), public.messages_before_update()
  from public, anon, authenticated, service_role;

grant execute on function public.receive_message(uuid[]) to anon, authenticated;
grant execute on function
  public.moderation_queue(text), public.moderate_message(uuid, text, text),
  public.pending_reports(), public.review_report(uuid)
  to authenticated;
grant execute on function public.check_rate_limit(text, text, int, int), public.purge_rate_limit_events()
  to service_role;
