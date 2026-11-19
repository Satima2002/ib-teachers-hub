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
};

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
