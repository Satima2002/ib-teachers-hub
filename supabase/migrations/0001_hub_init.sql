-- =====================================================================
-- Teacher Hub — этап 1: схема базы
-- Всё лежит в отдельной схеме `hub`, чтобы не пересекаться с таблицами
-- платформы юнитов в том же проекте Supabase.
--
-- Как применить: Supabase → SQL Editor → New query → вставить файл → Run.
-- Затем: Project Settings → Data API → Exposed schemas → добавить `hub` → Save.
-- =====================================================================

create schema if not exists hub;

-- ---------------------------------------------------------------------
-- Школы (заложено на будущее: сеть школ). Пока одна запись — ваша школа.
-- ---------------------------------------------------------------------
create table if not exists hub.schools (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Профили авторов. id = id пользователя в Supabase Auth.
-- ---------------------------------------------------------------------
create table if not exists hub.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  bio         text,
  avatar_path text,
  school_id   uuid references hub.schools (id),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Посты: семинар, статья, тренажёр, событие.
-- content_md — текст в Markdown со вставками блоков:
--     ::presentation[slides]     ::trainer[ielts]     ::file[plan]
-- body — JSON для визуального редактора (этап 2). Пока может быть пустым.
-- ---------------------------------------------------------------------
create table if not exists hub.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  type         text not null check (type in ('seminar', 'article', 'trainer', 'event')),
  title        text not null check (char_length(title) between 1 and 200),
  excerpt      text check (excerpt is null or char_length(excerpt) <= 400),
  cover_path   text,
  content_md   text not null default '',
  body         jsonb,
  status       text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  visibility   text not null default 'public' check (visibility in ('public', 'link', 'members')),
  author_id    uuid references hub.profiles (id) on delete set null,
  school_id    uuid references hub.schools (id),
  event_date   timestamptz,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists posts_feed_idx on hub.posts (status, visibility, published_at desc);
create index if not exists posts_type_idx on hub.posts (type);

-- ---------------------------------------------------------------------
-- Теги (хабы)
-- ---------------------------------------------------------------------
create table if not exists hub.tags (
  id   uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null
);

create table if not exists hub.post_tags (
  post_id uuid not null references hub.posts (id) on delete cascade,
  tag_id  uuid not null references hub.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ---------------------------------------------------------------------
-- Вложения поста: презентация (PDF), оригинал pptx, файлы, тренажёр.
-- storage_path — путь в бакете `hub-public` (для файлов),
-- url          — внешний адрес (для тренажёров на отдельном домене).
-- slug         — короткое имя для вставки в текст: ::trainer[ielts]
-- ---------------------------------------------------------------------
create table if not exists hub.assets (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references hub.posts (id) on delete cascade,
  kind         text not null check (kind in ('presentation_pdf', 'pptx', 'file', 'image', 'trainer')),
  slug         text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null,
  storage_path text,
  url          text check (url is null or url ~ '^https://'),
  size_bytes   bigint,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  unique (post_id, slug),
  check (storage_path is not null or url is not null),
  check (kind <> 'trainer' or url is not null)
);

create index if not exists assets_post_idx on hub.assets (post_id, position);

-- ---------------------------------------------------------------------
-- Статистика: просмотры/завершения и результаты тренажёров.
-- Без регистрации: anon_id — случайный id из браузера.
-- ---------------------------------------------------------------------
create table if not exists hub.events (
  id         uuid primary key default gen_random_uuid(),
  anon_id    uuid not null,
  post_id    uuid not null references hub.posts (id) on delete cascade,
  asset_id   uuid references hub.assets (id) on delete cascade,
  kind       text not null check (kind in ('view', 'finish')),
  created_at timestamptz not null default now()
);

create index if not exists events_post_idx on hub.events (post_id, kind);

create table if not exists hub.results (
  id           uuid primary key default gen_random_uuid(),
  anon_id      uuid not null,
  post_id      uuid not null references hub.posts (id) on delete cascade,
  asset_id     uuid not null references hub.assets (id) on delete cascade,
  lesson       text not null check (char_length(lesson) between 1 and 80),
  score        int  not null check (score >= 0),
  max_score    int  not null check (max_score > 0 and max_score <= 1000 and score <= max_score),
  first_try    boolean not null,
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  created_at   timestamptz not null default now()
);

create index if not exists results_asset_idx on hub.results (asset_id, lesson);

-- updated_at автоматически
create or replace function hub.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists posts_touch on hub.posts;
create trigger posts_touch before update on hub.posts
  for each row execute function hub.touch_updated_at();

-- published_at ставится при первой публикации
create or replace function hub.set_published_at() returns trigger
language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end $$;

drop trigger if exists posts_publish on hub.posts;
create trigger posts_publish before insert or update on hub.posts
  for each row execute function hub.set_published_at();

-- =====================================================================
-- ПРАВА ДОСТУПА (RLS)
-- На этапе 1 вы создаёте посты в панели Supabase — она работает
-- в обход RLS. С сайта (ключ anon) можно только:
--   * читать опубликованные посты, их теги и вложения;
--   * добавлять просмотры и результаты к опубликованным постам.
-- =====================================================================
alter table hub.schools   enable row level security;
alter table hub.profiles  enable row level security;
alter table hub.posts     enable row level security;
alter table hub.tags      enable row level security;
alter table hub.post_tags enable row level security;
alter table hub.assets    enable row level security;
alter table hub.events    enable row level security;
alter table hub.results   enable row level security;

-- Видимый пост: опубликован и не «только для вошедших»
create or replace function hub.is_visible_post(p uuid) returns boolean
language sql stable security definer set search_path = hub as $$
  select exists (
    select 1 from hub.posts
    where id = p and status = 'published' and visibility in ('public', 'link')
  );
$$;

drop policy if exists "read schools"   on hub.schools;
drop policy if exists "read profiles"  on hub.profiles;
drop policy if exists "read posts"     on hub.posts;
drop policy if exists "read tags"      on hub.tags;
drop policy if exists "read post_tags" on hub.post_tags;
drop policy if exists "read assets"    on hub.assets;
drop policy if exists "add events"     on hub.events;
drop policy if exists "add results"    on hub.results;

create policy "read schools"   on hub.schools   for select to anon, authenticated using (true);
create policy "read profiles"  on hub.profiles  for select to anon, authenticated using (true);
create policy "read posts"     on hub.posts     for select to anon, authenticated
  using (status = 'published' and visibility in ('public', 'link'));
create policy "read tags"      on hub.tags      for select to anon, authenticated using (true);
create policy "read post_tags" on hub.post_tags for select to anon, authenticated
  using (hub.is_visible_post(post_id));
create policy "read assets"    on hub.assets    for select to anon, authenticated
  using (hub.is_visible_post(post_id));

create policy "add events" on hub.events for insert to anon, authenticated
  with check (
    hub.is_visible_post(post_id)
    and (asset_id is null or exists (select 1 from hub.assets a where a.id = asset_id and a.post_id = events.post_id))
  );

create policy "add results" on hub.results for insert to anon, authenticated
  with check (
    hub.is_visible_post(post_id)
    and exists (select 1 from hub.assets a where a.id = asset_id and a.post_id = results.post_id and a.kind = 'trainer')
  );

-- Права на схему (Supabase требует их явно для своих схем)
grant usage on schema hub to anon, authenticated, service_role;
grant select on hub.schools, hub.profiles, hub.posts, hub.tags, hub.post_tags, hub.assets
  to anon, authenticated;
grant insert on hub.events, hub.results to anon, authenticated;
grant all on all tables in schema hub to service_role;

-- =====================================================================
-- ПУБЛИЧНАЯ СТАТИСТИКА (только итоговые цифры, без имён и баллов)
-- =====================================================================
create or replace function hub.post_stats()
returns table (post_id uuid, visitors bigint, finished bigint)
language sql stable security definer set search_path = hub as $$
  select e.post_id,
         count(distinct e.anon_id)                                    as visitors,
         count(distinct e.anon_id) filter (where e.kind = 'finish')   as finished
  from hub.events e
  where hub.is_visible_post(e.post_id)
  group by e.post_id;
$$;

revoke all on function hub.post_stats() from public;
revoke all on function hub.is_visible_post(uuid) from public;
grant execute on function hub.post_stats() to anon, authenticated;
grant execute on function hub.is_visible_post(uuid) to anon, authenticated;

-- =====================================================================
-- ХРАНИЛИЩЕ: публичный бакет для обложек, PDF и файлов.
-- Загружать файлы вы будете через панель (Storage), читать может любой.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('hub-public', 'hub-public', true)
on conflict (id) do nothing;
