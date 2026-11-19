-- =====================================================================
-- Пример: первый пост «IELTS для учителей»
-- Выполнить ПОСЛЕ 0001_hub_init.sql и после того, как:
--   1) вы создали себе пользователя: Authentication → Users → Add user;
--   2) загрузили файлы в Storage → бакет hub-public (см. README);
--   3) развернули тренажёр на отдельном домене (папка play, см. README).
-- Замените значения в <угловых скобках>.
-- =====================================================================

-- 1. Школа и ваш профиль
insert into hub.schools (name) values ('International Steppe School of Astana')
on conflict do nothing;

insert into hub.profiles (id, name, school_id)
select u.id, 'Сатима Вальсоны', (select id from hub.schools limit 1)
from auth.users u
where u.email = '<ваша-почта@пример.kz>'
on conflict (id) do update set name = excluded.name;

-- 2. Теги
insert into hub.tags (slug, name) values
  ('ielts', 'IELTS'),
  ('english', 'Английский'),
  ('seminar', 'Семинар')
on conflict (slug) do nothing;

-- 3. Пост. Вставки ::presentation[...] и ::trainer[...] ставят блоки в нужное место.
insert into hub.posts (slug, type, title, excerpt, content_md, status, visibility, author_id, school_id)
values (
  'ielts-lifehacks',
  'seminar',
  'IELTS Lifehacks: как перестать терять баллы',
  'Главное с семинара: стратегии по всем частям экзамена, частые ошибки и тренажёр для самопроверки.',
$md$
IELTS проверяет не только английский, но и **синонимы, парафраз и стратегию**. Ниже — главное с семинара.

## Главные правила

- **Listening:** всегда читайте вперёд и предсказывайте тип ответа.
- **Reading:** не скорость, а контроль. Matching Headings — первым, Matching Information — последним.
- **Writing:** без overview в Task 1 высокого балла нет.
- **Speaking:** формула PREP — Point, Reason, Example, Point.

## Презентация семинара

::presentation[slides]

## Попробуйте сами

Каждый тип задания: объяснение, практика и закрепление.

::trainer[ielts]
$md$,
  'published',
  'public',
  (select id from auth.users where email = '<ваша-почта@пример.kz>'),
  (select id from hub.schools limit 1)
)
on conflict (slug) do nothing;

-- 4. Теги поста
insert into hub.post_tags (post_id, tag_id)
select p.id, t.id from hub.posts p, hub.tags t
where p.slug = 'ielts-lifehacks' and t.slug in ('ielts', 'english', 'seminar')
on conflict do nothing;

-- 5. Вложения
insert into hub.assets (post_id, kind, slug, title, storage_path, url, position)
select p.id, v.kind, v.slug, v.title, v.storage_path, v.url, v.position
from hub.posts p,
(values
  ('presentation_pdf', 'slides', 'Презентация семинара', 'ielts-lifehacks/slides.pdf',  null::text, 1),
  ('pptx',             'slides-pptx', 'Презентация (PowerPoint)', 'ielts-lifehacks/slides.pptx', null::text, 2),
  ('trainer',          'ielts',  'IELTS notebook', null::text, 'https://<ваш-play-домен>.vercel.app/ielts/', 3)
) as v(kind, slug, title, storage_path, url, position)
where p.slug = 'ielts-lifehacks'
on conflict (post_id, slug) do nothing;


-- =====================================================================
-- ПОЛЕЗНЫЕ ЗАПРОСЫ ДЛЯ ВАС
-- =====================================================================

-- Посетители и завершения по постам
-- select p.title, s.visitors, s.finished
-- from hub.post_stats() s join hub.posts p on p.id = s.post_id;

-- Самые трудные задания по первой попытке
-- select r.lesson, count(*) as people,
--        round(avg(r.score::numeric / r.max_score) * 100) as avg_percent
-- from hub.results r
-- join hub.posts p on p.id = r.post_id
-- where p.slug = 'ielts-lifehacks' and r.first_try
-- group by r.lesson order by avg_percent;

-- Все результаты с именами
-- select r.created_at, coalesce(r.display_name, 'аноним') as name, r.lesson,
--        r.score || ' / ' || r.max_score as result, r.first_try
-- from hub.results r order by r.created_at desc;
