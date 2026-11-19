import Link from 'next/link';
import { POST_TYPES, type PostType } from '@/lib/types';

export function FeedTabs({ active }: { active?: PostType }) {
  return (
    <nav className="tabs" aria-label="Тип материалов">
      <Link href="/" aria-current={!active ? 'page' : undefined}>
        Все
      </Link>
      {POST_TYPES.map((t) => (
        <Link key={t.value} href={`/?type=${t.value}`} aria-current={active === t.value ? 'page' : undefined}>
          {t.plural}
        </Link>
      ))}
    </nav>
  );
}
