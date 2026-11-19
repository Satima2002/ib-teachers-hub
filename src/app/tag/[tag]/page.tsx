import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/PostCard';
import { getStats, getTagFeed } from '@/lib/posts';

export const revalidate = 60;

type Props = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const { tag: t } = await getTagFeed(tag);
  return { title: t ? `#${t.name}` : 'Не найдено' };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const [{ tag: t, posts }, stats] = await Promise.all([getTagFeed(tag), getStats()]);
  if (!t) notFound();

  return (
    <main className="wrap">
      <p className="meta">
        <Link href="/">← Все материалы</Link>
      </p>
      <h1 className="title-hl">{t.name}</h1>
      <p className="lead">Материалов с этим тегом: {posts.length}</p>
      <div className="feed">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} stats={stats[p.id]} />
        ))}
      </div>
    </main>
  );
}
