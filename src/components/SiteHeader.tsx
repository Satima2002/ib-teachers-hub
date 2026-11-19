import Link from 'next/link';

export type NavKey = 'all' | 'seminar' | 'article' | 'trainer' | 'ai';

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: 'all', label: 'Все', href: '/' },
  { key: 'seminar', label: 'Семинары', href: '/?type=seminar' },
  { key: 'article', label: 'Статьи', href: '/?type=article' },
  { key: 'trainer', label: 'Тренажёры', href: '/?type=trainer' },
  { key: 'ai', label: 'ИИ', href: '/tag/ai' },
];

export const NAV_LABEL: Record<NavKey, string> = Object.fromEntries(NAV.map((n) => [n.key, n.label])) as Record<
  NavKey,
  string
>;

export function SiteHeader({ active }: { active?: NavKey | null }) {
  return (
    <header className="site-header">
      <div className="in">
        <Link href="/" className="logo">
          <span className="logo-mark" aria-hidden="true" />
          <span className="logo-text">teachers hub</span>
        </Link>
        <nav className="nav" aria-label="Разделы">
          {NAV.map((n) => (
            <Link key={n.key} href={n.href} aria-current={active === n.key ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
