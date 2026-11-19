-- Рефлексия под постом. Писать может любой посетитель, читать — только вы
-- (в Supabase: Table Editor → схема hub → reflections). Чтения для сайта нет.
create table if not exists hub.reflections (
  id           uuid primary key default gen_random_uuid(),
  anon_id      uuid not null,
  post_id      uuid not null references hub.posts (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  liked        text check (liked    is null or char_length(liked)    <= 1000),
  thoughts     text check (thoughts is null or char_length(thoughts) <= 1000),
  missing      text check (missing  is null or char_length(missing)  <= 1000),
  created_at   timestamptz not null default now(),
  constraint reflections_not_empty check (coalesce(liked, thoughts, missing) is not null)
);

create index if not exists reflections_post_idx on hub.reflections (post_id, created_at desc);

alter table hub.reflections enable row level security;

drop policy if exists "add reflections" on hub.reflections;
create policy "add reflections" on hub.reflections for insert to anon, authenticated
  with check (hub.is_visible_post(post_id));

grant insert on hub.reflections to anon, authenticated;
grant all on hub.reflections to service_role;
