import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, IntroBand, PostList, TopicList } from '@/components/Feed';
import { SiteHeader } from '@/components/SiteHeader';
import { getFeed, getStats, getTagFeed, topicCounts } from '@/lib/posts';

export const revalidate = 60;

type Props = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const { tag: t } = await getTagFeed(tag);
  return { title: t ? `# ${t.name}` : tag === 'ai' ? 'ИИ' : 'Тема' };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const [{ tag: t, posts }, all, stats] = await Promise.all([getTagFeed(tag), getFeed(), getStats()]);
  const label = t ? t.name : tag === 'ai' ? 'ИИ' : tag;

  return (
    <>
      <SiteHeader active={tag === 'ai' ? 'ai' : null} />
      <IntroBand />
      <div className="page">
        <TopicList topics={topicCounts(all)} active={tag} />
        <main className="main">
          {tag !== 'ai' && (
            <div className="filter">
              <span className="muted">Тема:</span>
              <span className="chip-dark">
                # {label}
                <Link href="/" aria-label="Сбросить тему">
                  ×
                </Link>
              </span>
            </div>
          )}
          {posts.length === 0 ? <EmptyState label={label} /> : <PostList posts={posts} stats={stats} />}
        </main>
      </div>
    </>
  );
}
