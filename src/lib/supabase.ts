import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const BUCKET = 'hub-public';

// Типы базы на этапе 1 не генерируем (можно позже: `supabase gen types`).
type HubClient = SupabaseClient<any, any, any>;
let client: HubClient | null = null;

/**
 * Один клиент на сервер и браузер. Ключ публичный (anon / publishable):
 * всё, что можно с ним сделать, ограничено правилами RLS в базе.
 * Все таблицы лежат в схеме `hub`.
 */
export function db(): HubClient {
  if (!url || !key) {
    throw new Error('Не заданы NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY (см. .env.example)');
  }
  if (!client) {
    client = createClient(url, key, {
      db: { schema: 'hub' },
      auth: { persistSession: false },
    }) as unknown as HubClient;
  }
  return client;
}

/** Публичный адрес файла из бакета hub-public */
export function publicUrl(path: string | null | undefined): string | null {
  if (!path || !url) return null;
  return `${url.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}
