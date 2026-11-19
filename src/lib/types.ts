export type PostType = 'seminar' | 'article' | 'trainer' | 'event';

export const POST_TYPES: { value: PostType; label: string; plural: string }[] = [
  { value: 'seminar', label: 'Семинар', plural: 'Семинары' },
  { value: 'article', label: 'Статья', plural: 'Статьи' },
  { value: 'trainer', label: 'Тренажёр', plural: 'Тренажёры' },
  { value: 'event', label: 'Событие', plural: 'События' },
];

export function typeLabel(t: PostType): string {
  return POST_TYPES.find((x) => x.value === t)?.label ?? t;
}

export type Tag = { slug: string; name: string };

export type PostCardData = {
  id: string;
  slug: string;
  type: PostType;
  title: string;
  excerpt: string | null;
  cover_path: string | null;
  published_at: string | null;
  event_date: string | null;
  author: { name: string } | null;
  tags: Tag[];
  /** какие вложения есть у поста: для ярлыков «презентация», «тренажёр» */
  kinds: AssetKind[];
};

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

/** Ярлыки «текст · презентация · тренажёр» */
export function contentChips(kinds: AssetKind[]): string[] {
  const out = ['текст'];
  if (kinds.includes('presentation_pdf') || kinds.includes('pptx')) out.push('презентация');
  if (kinds.includes('trainer')) out.push('тренажёр');
  if (kinds.includes('file')) out.push('файлы');
  return out;
}

export type AssetKind = 'presentation_pdf' | 'pptx' | 'file' | 'image' | 'trainer';

export type Asset = {
  id: string;
  kind: AssetKind;
  slug: string;
  title: string;
  storage_path: string | null;
  url: string | null;
  size_bytes: number | null;
  position: number;
};

export type PostFull = PostCardData & {
  content_md: string;
  assets: Asset[];
};

export type PostStats = { visitors: number; finished: number };
