import Link from 'next/link';
import type { PostCardData, PostStats, Tag } from '@/lib/types';
import { BoxIcon, BulbIcon } from './Icons';
import { PostCard } from './PostCard';

export function IntroBand() {
  return (
    <section className="intro">
      <div className="in">
        <span className="bulb" aria-hidden="true">
          <BulbIcon />
        </span>
        <p>
          Возможно, вы найдёте здесь что-то <i>полезное</i> для себя
        </p>
      </div>
    </section>
  );
}

export function TopicList({ topics, active }: { topics: (Tag & { count: number })[]; active?: string }) {
  return (
    <aside className="side">
      <nav aria-label="Темы">
        <h3 className="label">ТЕМЫ</h3>
        {topics.length === 0 ? (
          <p className="muted small">Темы появятся вместе с материалами.</p>
        ) : (
          <div className="topics">
            {topics.map((t) => (
              <Link
                key={t.slug}
                href={active === t.slug ? '/' : `/tag/${t.slug}`}
                aria-current={active === t.slug ? 'page' : undefined}
              >
                <span># {t.name}</span>
                <span className="n">{t.count}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <section className="empty">
      <span className="ic" aria-hidden="true">
        <BoxIcon />
      </span>
      <h2>В разделе «{label}» пока пусто</h2>
      <p>Скоро здесь появятся материалы коллег.</p>
      <Link href="/" className="btn dark" style={{ marginTop: 8 }}>
        Смотреть все материалы
      </Link>
    </section>
  );
}

export function PostList({ posts, stats }: { posts: PostCardData[]; stats: Record<string, PostStats> }) {
  return (
    <>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} stats={stats[p.id]} />
      ))}
    </>
  );
}
