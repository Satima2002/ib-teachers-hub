-- =====================================================================
-- Пост-курс «Python шаг за шагом с Оркеном»
-- Выполнить в Supabase → SQL Editor ПОСЛЕ деплоя папки play (проект тренажёров).
-- Замените <ваш-play-домен> на адрес проекта тренажёров, например teacher-play.vercel.app
-- и <ваша-почта@пример.kz> на почту, которой вы создавали пользователя. Можно запускать повторно.
-- =====================================================================

insert into hub.tags (slug, name) values ('python', 'Python'), ('informatics', 'Информатика')
on conflict (slug) do nothing;

insert into hub.posts (slug, type, title, excerpt, content_md, status, visibility, author_id, school_id)
values (
  'python-course',
  'trainer',
  'Python шаг за шагом с Оркеном',
  'Открытый курс для 6–7 классов: print, ошибки, переменные, input, if/else/elif, while, for и своя игра. Четыре модуля, помощник Оркен, достижения.',
$md$
Курс для тех, кто начинает с нуля. Код запускается прямо на странице, каждый шаг проверяется сразу. Рядом всё время помогает Оркен.

**Модули** (можно проходить по порядку или выбрать нужный):

1. **Основы Python:** print, ошибки, порядок команд, переменные, input.
2. **Условия и отступы:** if, отступы, else, баллы, elif.
3. **Циклы:** while и for.
4. **Своя игра:** викторина из всего, что умеем.

Ученик сам решает, отправлять ли результаты учителю: переключатель «📤 Учителю» вверху. По умолчанию результаты остаются только у него. Имя можно вписать в поле над тренажёром (например, «Айя 6G»).

Курс с открытым кодом: исходники лежат в папке `play/python` репозитория сайта. Новые темы добавляются отдельным файлом-модулем.

::trainer[python]
$md$,
  'published',
  'public',
  (select id from auth.users where email = '<ваша-почта@пример.kz>'),
  (select id from hub.schools limit 1)
)
on conflict (slug) do nothing;

insert into hub.post_tags (post_id, tag_id)
select p.id, t.id from hub.posts p, hub.tags t
where p.slug = 'python-course' and t.slug in ('python', 'informatics')
on conflict do nothing;

insert into hub.assets (post_id, kind, slug, title, storage_path, url, position)
select p.id, 'trainer', 'python', 'Python шаг за шагом', null::text, 'https://<ваш-play-домен>/python/', 1
from hub.posts p
where p.slug = 'python-course'
on conflict (post_id, slug) do nothing;

-- Результаты учеников по шагам (3 — сам, 2 — с подсказкой, 1 — нужна помощь)
-- select coalesce(r.display_name,'аноним') as name, r.lesson, r.score, r.created_at
-- from hub.results r join hub.posts p on p.id = r.post_id
-- where p.slug = 'python-course' order by r.created_at desc;

-- Сколько шагов прошёл каждый ученик
-- select coalesce(r.display_name,'аноним') as name, count(distinct r.lesson) as steps, round(avg(r.score),1) as avg_score
-- from hub.results r join hub.posts p on p.id = r.post_id
-- where p.slug = 'python-course' group by 1 order by steps desc;
