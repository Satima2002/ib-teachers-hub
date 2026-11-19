import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileList } from '@/components/FileList';
import { CheckIcon, EyeIcon } from '@/components/Icons';
import { Markdown } from '@/components/Markdown';
import { PdfSlides } from '@/components/PdfSlides';
import { TypeLine } from '@/components/PostCard';
import { SiteHeader, type NavKey } from '@/components/SiteHeader';
import { TrainerEmbed } from '@/components/TrainerEmbed';
import { ViewTracker } from '@/components/ViewTracker';
import { readingMinutes, splitContent, tableOfContents } from '@/lib/content';
import { getPost, getStats } from '@/lib/posts';
import { publicUrl } from '@/lib/supabase';
import { contentChips, initials, type Asset, type PostFull } from '@/lib/types';

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
  const hasPdf = post.assets.some((a) => a.kind === 'presentation_pdf');

  // Вложения, которые не вставлены в текст, показываем после текста
  const rest = post.assets.filter((a) => !used.has(a.slug));
  const restBlocks = rest.filter((a) => a.kind === 'presentation_pdf' || a.kind === 'trainer');
  // .pptx при наличии PDF уже есть кнопкой «Скачать .pptx» в блоке презентации
  const files = rest.filter((a) => a.kind === 'file' || (a.kind === 'pptx' && !hasPdf));

  // Оглавление: заголовки текста + презентация и тренажёр
  const toc = tableOfContents(post.content_md);
  const slides = post.assets.find((a) => a.kind === 'presentation_pdf');
  const trainer = post.assets.find((a) => a.kind === 'trainer');
  if (slides && !toc.some((t) => /презентац/i.test(t.title))) toc.push({ id: 'slides', title: 'Презентация' });
  if (trainer) toc.push({ id: 'trainer', title: 'Тренажёр' });

  const s = stats[post.id];
  const navKey: NavKey | null = post.type === 'event' ? null : post.type;

  return (
    <>
      <SiteHeader active={navKey} />
      <ViewTracker postId={post.id} />
      <div className="page" style={{ gap: 40 }}>
        <article className="post">
          <Link href="/" className="back">
            ← Все материалы
          </Link>
          <TypeLine post={post} />
          <h1>{post.title}</h1>
          <div className="chips">
            {contentChips(post.kinds).map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <div className="meta-row">
            {post.author && (
              <span className="who">
                <span className="avatar" aria-hidden="true">
                  {initials(post.author.name)}
                </span>
                {post.author.name}
              </span>
            )}
            <span>{readingMinutes(post.content_md)} мин чтения</span>
            <span className="views" style={{ marginLeft: 0 }} title="Просмотры">
              <EyeIcon label="Просмотры" />
              {s?.visitors ?? 0}
            </span>
            {post.tags.length > 0 && (
              <span className="tags">
                {post.tags.map((t) => (
                  <Link key={t.slug} href={`/tag/${t.slug}`} className="tag">
                    # {t.name}
                  </Link>
                ))}
              </span>
            )}
          </div>

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

          <footer className="post-foot">
            <span className="stats">
              <span title="Просмотры">
                <EyeIcon label="Просмотры" />
                {s?.visitors ?? 0}
              </span>
              <span title="Прошли урок">
                <CheckIcon label="Прошли урок" />
                {s?.finished ?? 0}
              </span>
            </span>
            <Link href="/">← Все материалы</Link>
          </footer>
        </article>

        {toc.length > 0 && (
          <aside className="toc-wrap">
            <nav className="toc" aria-label="В этом материале">
              <h3 className="label">В ЭТОМ МАТЕРИАЛЕ</h3>
              <div className="links">
                {toc.map((t) => (
                  <a key={t.id} href={`#${t.id}`}>
                    {t.title}
                  </a>
                ))}
              </div>
            </nav>
          </aside>
        )}
      </div>
    </>
  );
}

function AssetBlock({ post, asset, pptx }: { post: PostFull; asset: Asset; pptx?: Asset }) {
  if (asset.kind === 'presentation_pdf') {
    const url = asset.url ?? publicUrl(asset.storage_path);
    if (!url) return null;
    const dl = pptx ? pptx.url ?? publicUrl(pptx.storage_path) : null;
    return <PdfSlides url={url} title={asset.title} downloadUrl={dl} anchorId="slides" />;
  }
  if (asset.kind === 'trainer' && asset.url) {
    return (
      <TrainerEmbed
        postId={post.id}
        assetId={asset.id}
        url={asset.url}
        title={asset.title}
        fullscreenHref={`/p/${post.slug}/play/${asset.slug}`}
        anchorId="trainer"
      />
    );
  }
  if (asset.kind === 'image') {
    const src = asset.url ?? publicUrl(asset.storage_path);
    return src ? <img src={src} alt={asset.title} style={{ borderRadius: 14, margin: '16px 0' }} /> : null;
  }
  return <FileList files={[asset]} title={asset.title} />;
}
