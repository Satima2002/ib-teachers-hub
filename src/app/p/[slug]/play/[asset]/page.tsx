import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { TrainerEmbed } from '@/components/TrainerEmbed';
import { ViewTracker } from '@/components/ViewTracker';
import { getPost } from '@/lib/posts';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string; asset: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, asset } = await params;
  const post = await getPost(slug);
  const a = post?.assets.find((x) => x.slug === asset && x.kind === 'trainer');
  return { title: a ? a.title : 'Не найдено' };
}

/** Тренажёр на весь экран: удобно с телефона */
export default async function PlayPage({ params }: Props) {
  const { slug, asset } = await params;
  const post = await getPost(slug);
  const a = post?.assets.find((x) => x.slug === asset && x.kind === 'trainer');
  if (!post || !a || !a.url) notFound();

  return (
    <>
      <SiteHeader active={null} />
      <ViewTracker postId={post.id} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 16px 24px' }}>
        <Link href={`/p/${post.slug}`} className="back">
          ← {post.title}
        </Link>
        <TrainerEmbed postId={post.id} assetId={a.id} url={a.url} title={a.title} bare />
      </main>
    </>
  );
}
