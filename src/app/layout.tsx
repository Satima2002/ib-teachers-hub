import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Golos_Text, Caveat } from 'next/font/google';
import './globals.css';

// Golos Text создан для кириллицы и хорошо читается; Caveat — «рукописные» заголовки.
const body = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  variable: '--font-body',
  display: 'swap',
});
const hand = Caveat({ subsets: ['latin', 'cyrillic'], weight: ['700'], variable: '--font-hand', display: 'swap' });

const SITE = process.env.NEXT_PUBLIC_SITE_NAME || 'Материалы для учителей';

export const metadata: Metadata = {
  title: { default: SITE, template: `%s · ${SITE}` },
  description: 'Семинары, статьи и тренажёры для учителей: объяснение, практика, закрепление.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${body.variable} ${hand.variable}`}>
      <body>
        <header className="site-header">
          <div className="in">
            <Link href="/" className="brand">
              {SITE}
            </Link>
          </div>
        </header>
        {children}
        <footer className="site-footer">Материалы публикуют учителя. Результаты тренажёров видит только автор.</footer>
      </body>
    </html>
  );
}
