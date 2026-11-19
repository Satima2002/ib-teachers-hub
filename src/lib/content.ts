/**
 * Текст поста — Markdown со вставками блоков на отдельной строке:
 *   ::presentation[slides]   ::trainer[ielts]   ::file[plan]
 * В скобках — slug вложения из таблицы assets.
 */
export type Segment =
  | { kind: 'md'; text: string }
  | { kind: 'embed'; type: 'presentation' | 'trainer' | 'file'; slug: string };

const EMBED = /^::(presentation|trainer|file)\[([a-z0-9-]+)\]\s*$/;

export function splitContent(md: string): Segment[] {
  const out: Segment[] = [];
  let buf: string[] = [];
  const flush = () => {
    const text = buf.join('\n').trim();
    if (text) out.push({ kind: 'md', text });
    buf = [];
  };
  for (const line of md.replace(/\r\n/g, '\n').split('\n')) {
    const m = line.trim().match(EMBED);
    if (m) {
      flush();
      out.push({ kind: 'embed', type: m[1] as 'presentation' | 'trainer' | 'file', slug: m[2] });
    } else {
      buf.push(line);
    }
  }
  flush();
  return out;
}

/** Примерное время чтения (200 слов в минуту) */
export function readingMinutes(md: string): number {
  const words = md.replace(/::\w+\[[^\]]*\]/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
