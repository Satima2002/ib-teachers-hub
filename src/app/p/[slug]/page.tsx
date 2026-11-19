import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileList } from '@/components/FileList';
import { Markdown } from '@/components/Markdown';
import { PdfSlides } from '@/components/PdfSlides';
import { PostMeta } from '@/components/PostCard';
import { TrainerEmbed } from '@/components/TrainerEmbed';
import { ViewTracker } from '@/components/ViewTracker';
import { readingMinutes, splitContent } from '@/lib/content';
import { getPost, getStats } from '@/lib/posts';
import { publicUrl } from '@/lib/supabase';
import type { Asset, PostFull } from '@/lib/types';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Не найдено' };
  return { title: post.title, description: post.excerpt ?? undefined };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const [post, stats] = await Promise.all([getPost(slug), getStats()]);
  if (!post) notFound();

  const segments = splitContent(post.content_md);
  const used = new Set(segments.flatMap((s) => (s.kind === 'embed' ? [s.slug] : [])));
  const bySlug = new Map(post.assets.map((a) => [a.slug, a]));
  const pptx = post.assets.find((a) => a.kind === 'pptx');

  // Вложения, которые не вставлены в текст, показываем после текста (вариант «А»)
  const rest = post.assets.filter((a) => !used.has(a.slug));
  const restBlocks = rest.filter((a) => a.kind === 'presentation_pdf' || a.kind === 'trainer');
  const files = rest.filter((a) => a.kind === 'file' || (a.kind === 'pptx' && !hasPdf(post)));

  const s = stats[post.id];

  return (
    <main className="wrap">
      <ViewTracker postId={post.id} />
      <header className="post-head">
        <PostMeta post={post} />
        <h1>{post.title}</h1>
        <div className="meta">
          <span>{readingMinutes(post.content_md)} мин чтения</span>
          {post.tags.length > 0 && (
            <span className="tags">
              {post.tags.map((t) => (
                <Link key={t.slug} href={`/tag/${t.slug}`} className="tag">
                  {t.name}
                </Link>
              ))}
            </span>
          )}
        </div>
      </header>

      {segments.map((seg, i) => {
        if (seg.kind === 'md') return <Markdown key={i} text={seg.text} />;
        const asset = bySlug.get(seg.slug);
        if (!asset) return null;
        return <AssetBlock key={i} post={post} asset={asset} pptx={pptx} />;
      })}

      {restBlocks.map((a) => (
        <AssetBlock key={a.id} post={post} asset={a} pptx={pptx} />
      ))}

      <FileList files={files} />

      <footer className="post-foot meta">
        {s && s.visitors > 0 ? (
          <span className="stat">
            Посетителей: <b>{s.visitors}</b>
            {s.finished > 0 && (
              <>
                {' '}
                · прошли урок: <b>{s.finished}</b>
              </>
            )}
          </span>
        ) : (
          <span>Вы среди первых читателей</span>
        )}
        <Link href="/">← Все материалы</Link>
      </footer>
    </main>
  );
}

function hasPdf(post: PostFull) {
  return post.assets.some((a) => a.kind === 'presentation_pdf');
}

function AssetBlock({ post, asset, pptx }: { post: PostFull; asset: Asset; pptx?: Asset }) {
  if (asset.kind === 'presentation_pdf') {
    const url = asset.url ?? publicUrl(asset.storage_path);
    if (!url) return null;
    const dl = pptx ? pptx.url ?? publicUrl(pptx.storage_path) : null;
    return <PdfSlides url={url} title={asset.title} downloadUrl={dl} />;
  }
  if (asset.kind === 'trainer' && asset.url) {
    return (
      <TrainerEmbed
        postId={post.id}
        assetId={asset.id}
        url={asset.url}
        title={asset.title}
        fullscreenHref={`/p/${post.slug}/play/${asset.slug}`}
      />
    );
  }
  if (asset.kind === 'image') {
    const src = asset.url ?? publicUrl(asset.storage_path);
    return src ? <img src={src} alt={asset.title} style={{ borderRadius: 12, margin: '1rem 0' }} /> : null;
  }
  // file / pptx, вставленные в текст
  return <FileList files={[asset]} title={asset.title} />;
}
