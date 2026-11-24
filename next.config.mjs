/** @type {import('next').NextConfig} */

// Домен, с которого разрешено встраивать тренажёры (папка play, отдельный проект Vercel).
// Пример: https://teacher-play.vercel.app
const PLAY_ORIGIN = process.env.NEXT_PUBLIC_PLAY_ORIGIN || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE_URL}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE_URL}`,
  "worker-src 'self' blob:",
  `frame-src ${PLAY_ORIGIN || "'none'"}`,
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // короткий адрес курса
    return [{ source: '/courses/python', destination: '/p/python-course', permanent: false }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
