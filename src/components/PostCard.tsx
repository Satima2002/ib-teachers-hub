import Link from 'next/link';
import { publicUrl } from '@/lib/supabase';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { typeLabel, type PostCardData, type PostStats } from '@/lib/types';

export function PostMeta({ post }: { post: PostCardData }) {
  const isEvent = post.type === 'event' && post.event_date;
  const past = isEvent && new Date(post.event_date!).getTime() < Date.now();
  return (
    <div className="meta">
      <span className={`badge${past ? ' past' : ''}`}>
        {typeLabel(post.type)}
        {isEvent ? (past ? ' · прошло' : ' · скоро') : ''}
      </span>
      {isEvent ? <span>{fmtDateTime(post.event_date)}</span> : <span>{fmtDate(post.published_at)}</span>}
      {post.author && <span>{post.author.name}</span>}
    </div>
  );
}

export function PostCard({ post, stats }: { post: PostCardData; stats?: PostStats }) {
  const cover = publicUrl(post.cover_path);
  return (
    <Link href={`/p/${post.slug}`} className="card">
      <div>
        <PostMeta post={post} />
        <h2>{post.title}</h2>
        {post.excerpt && <p>{post.excerpt}</p>}
        {post.tags.length > 0 && (
          <div className="tags">
            {post.tags.map((t) => (
              <span key={t.slug} className="tag">
                {t.name}
              </span>
            ))}
          </div>
        )}
        {stats && stats.visitors > 0 && (
          <div className="meta stat">
            <span>
              Посетителей: <b>{stats.visitors}</b>
            </span>
            {stats.finished > 0 && (
              <span>
                прошли урок: <b>{stats.finished}</b>
              </span>
            )}
          </div>
        )}
      </div>
      {cover && <img className="cover" src={cover} alt="" loading="lazy" />}
    </Link>
  );
}
