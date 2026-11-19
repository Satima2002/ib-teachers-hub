import { FeedTabs } from '@/components/FeedTabs';
import { PostCard } from '@/components/PostCard';
import { getFeed, getStats } from '@/lib/posts';
import { POST_TYPES, type PostType } from '@/lib/types';

export const revalidate = 60; // лента обновляется раз в минуту

type Props = { searchParams: Promise<{ type?: string }> };

export default async function Home({ searchParams }: Props) {
  const { type } = await searchParams;
  const active = POST_TYPES.some((t) => t.value === type) ? (type as PostType) : undefined;
  const [posts, stats] = await Promise.all([getFeed({ type: active }), getStats()]);

  return (
    <main className="wrap">
      <h1 className="title-hl">Материалы для учителей</h1>
      <p className="lead">Семинары, статьи и тренажёры. Каждый материал: объяснение, практика и закрепление.</p>
      <FeedTabs active={active} />
      {posts.length === 0 ? (
        <p className="empty">Здесь пока пусто. Скоро появятся первые материалы.</p>
      ) : (
        <div className="feed">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} stats={stats[p.id]} />
          ))}
        </div>
      )}
    </main>
  );
}
