import type { Metadata, Viewport } from 'next';
import { Onest, Playfair_Display } from 'next/font/google';
import './globals.css';

// Onest — текст, Playfair Display — заголовки и логотип. Оба с кириллицей.
const body = Onest({ subsets: ['latin', 'cyrillic'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
const serif = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  weight: ['600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const SITE = process.env.NEXT_PUBLIC_SITE_NAME || 'teachers hub';

export const metadata: Metadata = {
  title: { default: SITE, template: `%s · ${SITE}` },
  description: 'Семинары, статьи и тренажёры для учителей: объяснение, практика, закрепление.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0c2a25',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${body.variable} ${serif.variable}`}>
      <body>
        {children}
        <footer className="site-footer">Материалы публикуют учителя. Результаты тренажёров видит только автор.</footer>
      </body>
    </html>
  );
}
