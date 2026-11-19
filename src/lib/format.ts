const DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Almaty' });
const DATETIME = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Almaty',
});

export function fmtDate(iso: string | null | undefined): string {
  return iso ? DATE.format(new Date(iso)) : '';
}

export function fmtDateTime(iso: string | null | undefined): string {
  return iso ? DATETIME.format(new Date(iso)) : '';
}

export function fmtSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}
