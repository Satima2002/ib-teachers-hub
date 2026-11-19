import Link from 'next/link';
import { publicUrl } from '@/lib/supabase';
import { fmtDateTime } from '@/lib/format';
import { contentChips, initials, typeLabel, type PostCardData, type PostStats } from '@/lib/types';
import { EyeIcon } from './Icons';

export function TypeLine({ post }: { post: PostCardData }) {
  const isEvent = post.type === 'event' && post.event_date;
  const past = isEvent && new Date(post.event_date!).getTime() < Date.now();
  return (
    <div className="type-line">
      {typeLabel(post.type)}
      {isEvent ? ` · ${past ? 'прошло' : 'скоро'} · ${fmtDateTime(post.event_date)}` : ''}
    </div>
  );
}

export function PostCard({ post, stats }: { post: PostCardData; stats?: PostStats }) {
  const cover = publicUrl(post.cover_path);
  const href = `/p/${post.slug}`;
  return (
    <article className="card">
      <Link href={href} className="card-cover" tabIndex={-1} aria-hidden="true">
        {cover ? (
          <img src={cover} alt="" loading="lazy" />
        ) : (
          <span className="ph">
            <span className="logo-mark" style={{ width: 22, height: 22, boxShadow: '9px 9px 0 var(--saffron)' }} />
            {typeLabel(post.type)}
          </span>
        )}
      </Link>
      <div className="card-body">
        <TypeLine post={post} />
        <h2>
          <Link href={href}>{post.title}</Link>
        </h2>
        {post.excerpt && <p className="desc">{post.excerpt}</p>}
        <div className="chips">
          {contentChips(post.kinds).map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className="byline">
          {post.author && (
            <>
              <span className="avatar" aria-hidden="true">
                {initials(post.author.name)}
              </span>
              <span style={{ fontWeight: 600 }}>{post.author.name}</span>
            </>
          )}
          <span className="views" title="Просмотры">
            <EyeIcon label="Просмотры" />
            {stats?.visitors ?? 0}
          </span>
        </div>
        <Link href={href} className="btn dark">
          Открыть материал →
        </Link>
      </div>
    </article>
  );
}
