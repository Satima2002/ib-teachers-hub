# Teacher Hub: этап 1

Сайт с материалами для учителей: лента постов (семинары, статьи, тренажёры, события), страница поста с текстом, слайдами из PDF и встроенным тренажёром, статистика без регистрации.

- Архитектура: [`docs/architecture.md`](docs/architecture.md)
- Протокол тренажёров: [`docs/trainer-protocol.md`](docs/trainer-protocol.md)

Стек: Next.js 15 (App Router, TypeScript), Supabase (Postgres + RLS + Storage), Vercel.

---

## Запуск: по шагам

### 1. База (Supabase, 5 минут)

1. Supabase → **SQL Editor** → New query → вставьте `supabase/migrations/0001_hub_init.sql` → **Run**.
2. **Project Settings → Data API → Exposed schemas**: добавьте `hub` → **Save**.
   Без этого сайт не увидит таблицы.
3. **Authentication → Users → Add user**: создайте себе пользователя (ваша почта).

### 2. Тренажёры на отдельном домене (Vercel, 5 минут)

1. Загрузите весь репозиторий на GitHub (см. шаг 4) или пока только папку `play`.
2. Vercel → **Add New → Project** → репозиторий → **Root Directory: `play`** → Framework: **Other** → Deploy.
3. Получите адрес, например `https://teacher-play.vercel.app`. Тренажёр будет по адресу `.../ielts/`.

### 3. Файлы первого поста (Supabase Storage, 5 минут)

1. Экспортируйте презентацию в PDF (PowerPoint → Файл → Экспорт → PDF).
   Перед этим «Сжать рисунки», чтобы файл был легче.
2. Supabase → **Storage** → бакет `hub-public` → создайте папку `ielts-lifehacks` → загрузите `slides.pdf` и, если хотите, `slides.pptx`.
3. Откройте `supabase/seed_example.sql`, замените `<ваша-почта@пример.kz>` и `<ваш-play-домен>` → выполните в SQL Editor.

### 4. Сайт (GitHub + Vercel, 15 минут)

1. GitHub → New repository `teacher-hub` → загрузите все файлы этой папки.
2. Vercel → **Add New → Project** → тот же репозиторий → **Root Directory: оставить пустым** → Framework: **Next.js**.
3. **Environment Variables** (значения из `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: публичный ключ (anon или publishable, **не** secret)
   - `NEXT_PUBLIC_PLAY_ORIGIN`: адрес из шага 2, без слэша в конце
   - `NEXT_PUBLIC_SITE_NAME`: название сайта
4. **Deploy**.

Один репозиторий даёт два проекта Vercel: сайт (корень) и тренажёры (`play`).

### 5. Проверка

1. Главная показывает карточку «IELTS Lifehacks».
2. В посте листаются слайды, и тренажёр открывается внутри.
3. Впишите имя над тренажёром, сделайте любое задание в Reading.
4. Supabase → **Table Editor** → схема `hub` → `results`: появилась строка.
5. Через минуту под постом появится «Посетителей: 1».

Если что-то не работает: F12 → Console → скриншот ошибки.

---

## Локальная разработка

```bash
npm install
cp .env.example .env.local   # заполнить
npm run dev                  # http://localhost:3000
npm run typecheck
```

Для локальной проверки тренажёра можно поставить `NEXT_PUBLIC_PLAY_ORIGIN` на ваш play-домен в Vercel.

## Как добавить новый пост (этап 1)

1. **Storage** → `hub-public` → папка с именем поста → загрузите PDF и файлы.
2. **Table Editor** → `hub.posts` → Insert row:
   - `slug`: латиницей через дефис (`ai-for-english-teachers`)
   - `type`: `seminar` | `article` | `trainer` | `event`
   - `title`, `excerpt`, `content_md` (текст; вставки `::presentation[slides]`, `::trainer[ielts]`)
   - `status`: `published`, `visibility`: `public` (или `link`, чтобы не показывать в ленте)
   - для события заполните `event_date`
3. `hub.assets` → строки для вложений: `post_id`, `kind`, `slug`, `title`, `storage_path` (путь в бакете) или `url` (для тренажёра).
4. `hub.post_tags` → свяжите с тегами.

Через минуту пост появится на сайте.

## Как добавить новый тренажёр

1. Положите `play/<имя>/index.html`, сделанный по [протоколу](docs/trainer-protocol.md).
2. Commit в GitHub: play-проект обновится сам.
3. В `hub.assets` добавьте строку `kind = trainer`, `url = https://<play-домен>/<имя>/`.
