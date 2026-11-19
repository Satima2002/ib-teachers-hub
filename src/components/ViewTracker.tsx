'use client';

import { useEffect } from 'react';
import { db } from '@/lib/supabase';
import { anonId } from '@/lib/anon';

/** Один просмотр поста за сессию браузера */
export function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const key = `hub:viewed:${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* без sessionStorage просто считаем каждый заход */
    }
    db()
      .from('events')
      .insert({ anon_id: anonId(), post_id: postId, kind: 'view' })
      .then(({ error }) => {
        if (error) console.warn('view not saved', error.message);
      });
  }, [postId]);
  return null;
}
