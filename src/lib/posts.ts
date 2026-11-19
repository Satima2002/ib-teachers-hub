import { db } from './supabase';
import type { Asset, PostCardData, PostFull, PostStats, PostType, Tag } from './types';

const CARD_FIELDS =
  'id, slug, type, title, excerpt, cover_path, published_at, event_date, author:profiles(name), post_tags(tags(slug, name))';

type Row = Record<string, any>;

function toCard(r: Row): PostCardData {
  const tags: Tag[] = (r.post_tags ?? [])
    .map((pt: Row) => pt.tags)
    .filter(Boolean)
    .map((t: Row) => ({ slug: t.slug, name: t.name }));
  const author = Array.isArray(r.author) ? r.author[0] : r.author;
  return {
    id: r.id,
    slug: r.slug,
    type: r.type,
    title: r.title,
    excerpt: r.excerpt,
    cover_path: r.cover_path,
    published_at: r.published_at,
    event_date: r.event_date,
    author: author ? { name: author.name } : null,
    tags,
  };
}

/** Лента: только публичные опубликованные посты (не «по ссылке») */
export async function getFeed(opts: { type?: PostType; ids?: string[] } = {}): Promise<PostCardData[]> {
  let q = db()
    .from('posts')
    .select(CARD_FIELDS)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('published_at', { ascending: false })
    .limit(50);
  if (opts.type) q = q.eq('type', opts.type);
  if (opts.ids) q = q.in('id', opts.ids.length ? opts.ids : ['00000000-0000-0000-0000-000000000000']);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(toCard);
}

/** Пост по адресу. Посты «по ссылке» тоже открываются, но в ленте не видны. */
export async function getPost(slug: string): Promise<PostFull | null> {
  const { data, error } = await db()
    .from('posts')
    .select(`${CARD_FIELDS}, content_md, assets(id, kind, slug, title, storage_path, url, size_bytes, position)`)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const assets: Asset[] = ((data as Row).assets ?? []).sort((a: Asset, b: Asset) => a.position - b.position);
  return { ...toCard(data as Row), content_md: (data as Row).content_md ?? '', assets };
}

/** Посты с тегом */
export async function getTagFeed(tagSlug: string): Promise<{ tag: Tag | null; posts: PostCardData[] }> {
  const { data: tag } = await db().from('tags').select('id, slug, name').eq('slug', tagSlug).maybeSingle();
  if (!tag) return { tag: null, posts: [] };
  const { data: links } = await db().from('post_tags').select('post_id').eq('tag_id', (tag as Row).id);
  const ids = (links ?? []).map((l: Row) => l.post_id as string);
  const posts = await getFeed({ ids });
  return { tag: { slug: (tag as Row).slug, name: (tag as Row).name }, posts };
}

/** Публичные цифры: посетители и завершения по постам */
export async function getStats(): Promise<Record<string, PostStats>> {
  const { data, error } = await db().rpc('post_stats');
  if (error || !data) return {};
  const out: Record<string, PostStats> = {};
  for (const r of data as Row[]) out[r.post_id] = { visitors: Number(r.visitors), finished: Number(r.finished) };
  return out;
}
