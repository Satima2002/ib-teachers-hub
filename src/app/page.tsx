import { EmptyState, IntroBand, PostList, TopicList } from '@/components/Feed';
import { NAV_LABEL, SiteHeader, type NavKey } from '@/components/SiteHeader';
import { getFeed, getStats, topicCounts } from '@/lib/posts';
import type { PostType } from '@/lib/types';

export const revalidate = 60; // лента обновляется раз в минуту

const TYPES: PostType[] = ['seminar', 'article', 'trainer', 'event'];

type Props = { searchParams: Promise<{ type?: string }> };

export default async function Home({ searchParams }: Props) {
  const { type } = await searchParams;
  const active = TYPES.includes(type as PostType) ? (type as PostType) : undefined;
  const [all, stats] = await Promise.all([getFeed(), getStats()]);
  const posts = active ? all.filter((p) => p.type === active) : all;
  const navKey: NavKey = active && active !== 'event' ? active : 'all';

  return (
    <>
      <SiteHeader active={navKey} />
      <IntroBand />
      <div className="page">
        <TopicList topics={topicCounts(all)} />
        <main className="main">
          {posts.length === 0 ? (
            <EmptyState label={active === 'event' ? 'События' : NAV_LABEL[navKey]} />
          ) : (
            <PostList posts={posts} stats={stats} />
          )}
        </main>
      </div>
    </>
  );
}
