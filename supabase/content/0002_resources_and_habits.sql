-- =====================================================================
-- Статья «Ресурсы для подготовки к IELTS» + блок привычек в посте семинара
-- Supabase → SQL Editor → вставить → Run. Можно запускать повторно.
-- Ссылки проверены 19.11.2026; доступность в школьной сети проверьте сами.
-- =====================================================================

insert into hub.tags (slug, name) values ('resources', 'Ресурсы')
on conflict (slug) do nothing;

insert into hub.posts (slug, type, title, excerpt, content_md, status, visibility, author_id, school_id)
values (
  'ielts-resources',
  'article',
  'Ресурсы для подготовки к IELTS: официальное и проверенное',
  'Бесплатные официальные тесты, книги, критерии оценивания и сайты опытных преподавателей — в одном списке.',
$md$
Сторонние пробники сильно различаются по качеству. Поэтому начинайте с официальных материалов от организаций, которые проводят экзамен, а остальное используйте как дополнение.

## Официальные пробные задания и тесты

- [IELTS.org — образцы заданий](https://ielts.org/take-a-test/preparation-resources/sample-test-questions): официальные примеры для всех четырёх частей.
- [British Council — бесплатные тесты Academic](https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/academic): Listening, Reading, Writing и Speaking.
- [British Council — бесплатные тесты General Training](https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/general-training).
- [British Council Казахстан — тест на компьютере (familiarisation)](https://kazakhstan.britishcouncil.org/exam/ielts/prepare/computer-delivered-ielts-familiarisation-test): чтобы заранее привыкнуть к интерфейсу.
- [IELTS Ready от British Council](https://takeielts.britishcouncil.org/take-ielts/prepare/ielts-ready): бесплатная подготовка онлайн и приложение.
- IDP — раздел подготовки на сайте [ielts.idp.com](https://ielts.idp.com): пробные тесты и диагностика (выберите свою страну).

## Критерии оценивания

- [Writing band descriptors (IELTS.org, PDF)](https://ielts.org/cdn/ielts-downloadable-assets/ielts-guidance-and-support/ielts-guides/ielts-writing-band-descriptors.pdf): по чему оценивают Writing.
- [IELTS Guide for Teachers (British Council, PDF)](https://takeielts.britishcouncil.org/sites/default/files/ielts_guide_for_teachers.pdf): формат, критерии и советы для учителей.
- [Подготовка учеников к Task 1 (блог IELTS для учителей)](https://www.ielts.org/blog-for-teachers/2021/preparing-learners-for-task-1-on-the-ielts-academic-writing-test).

> Все четыре критерия Writing и Speaking весят одинаково. В Writing Task 2 даёт вдвое больше, чем Task 1.

## Книги

- **Cambridge IELTS 12 и новее** — реальные прошлые тесты, самая достоверная практика. Начинайте с последнего номера.
- **The Official Cambridge Guide to IELTS** — все четыре навыка с объяснениями.
- **Cambridge IELTS Trainer** — тесты с пояснениями и советами преподавателя.
- **Collins Practice Tests / Collins Writing и Reading for IELTS** — хорошее дополнение для отдельных навыков.

## Сайты и каналы преподавателей

- [IELTS Liz](https://ieltsliz.com) — уроки, советы и примеры ответов по всем частям.
- [IELTS Simon](https://ieltssimon.substack.com) — практичные советы от бывшего экзаменатора, сильнее всего по Writing и Speaking.
- [IELTS Advantage](https://www.ieltsadvantage.com) — подробные стратегии, особенно по Writing Task 1 и Task 2.

## Как пользоваться ресурсами

1. Начните с **диагностического теста**, чтобы понять слабое место.
2. Тренируйте **один тип заданий**, а не бесконечные полные тесты.
3. Сначала **без таймера**, потом с таймером.
4. Ведите **журнал ошибок**: спеллинг, парафраз или пропущенная деталь.
5. Для Writing и Speaking нужен **человек, знающий критерии**. ИИ помогает практиковаться, но его оценки в баллах ненадёжны.

*Подборка составлена по материалам официальных сайтов и рекомендаций модераторов сообщества r/IELTS.*
$md$,
  'published', 'public',
  (select author_id from hub.posts where slug = 'ielts-lifehacks'),
  (select id from hub.schools limit 1)
)
on conflict (slug) do update set
  title = excluded.title, excerpt = excluded.excerpt, content_md = excluded.content_md;

insert into hub.post_tags (post_id, tag_id)
select p.id, t.id from hub.posts p, hub.tags t
where p.slug = 'ielts-resources' and t.slug in ('ielts', 'english', 'resources')
on conflict do nothing;

-- Пост семинара: текст с привычками и ссылкой на ресурсы после тренажёра
update hub.posts set content_md = $md$
IELTS проверяет не только английский, но и **синонимы, парафраз и стратегию**. Трюков, которые превратят Band 5 в Band 8, нет, но понимание формата, тайминга и ловушек помогает показать свой уровень полностью.

## Главные правила

- **Listening:** всегда читайте вперёд и предсказывайте тип ответа. Слушайте фразу до конца: говорящие исправляются.
- **Reading:** не скорость, а контроль. Matching Headings — первым, Matching Information — последним.
- **Правила записи:** лимит слов — закон, числа цифрами, форма слова как в тексте.
- **Writing:** без overview в Task 1 высокого балла нет. В Task 2 — план до текста.
- **Speaking:** формула PREP — Point, Reason, Example, Point. Беглость — это не скорость.

::presentation[slides]

## Попробуйте сами

Каждый тип задания: объяснение, практика и закрепление.

::trainer[ielts]

## Привычки на каждый день (30–40 минут)

- **10 минут** — подкаст или интервью с разными акцентами; перед аудио предскажите, о чём будет.
- **1 текст без таймера** — найдите все парафразы между вопросами и текстом.
- **10 синонимов** по одной теме: рост, расходы, окружающая среда.
- **1 абзац Writing** — overview к графику или абзац эссе по плану.
- **2 ответа PREP вслух** — запишите на телефон и переслушайте.
- **5 минут** — журнал ошибок: ошибки дня и одна закономерность.

Не обязательно всё каждый день: выберите 2–3 пункта под своё слабое место. Регулярность важнее объёма.

## Ресурсы

Официальные тесты, книги, критерии и сайты преподавателей собраны в статье [«Ресурсы для подготовки к IELTS»](/p/ielts-resources).
$md$
where slug = 'ielts-lifehacks';
