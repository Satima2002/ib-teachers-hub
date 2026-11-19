'use client';

import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/supabase';
import { anonId, getStored, setStored } from '@/lib/anon';

type Props = {
  postId: string;
  assetId: string;
  url: string;
  title: string;
  fullscreenHref?: string;
  /** на странице «на весь экран» — без рамки и поля имени сверху */
  bare?: boolean;
};

const NAME_KEY = 'hub:name';
const MIN_H = 480;
const MAX_H = 20000;

/**
 * Встроенный тренажёр.
 * Тренажёр открывается с ОТДЕЛЬНОГО домена в iframe и ничего не знает о базе:
 * он присылает сообщения (протокол v1, см. docs/trainer-protocol.md),
 * а эта страница проверяет их и записывает в Supabase.
 */
export function TrainerEmbed({ postId, assetId, url, title, fullscreenHref, bare }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(getStored(NAME_KEY) ?? '');
  }, []);

  useEffect(() => {
    let origin: string;
    try {
      origin = new URL(url).origin;
    } catch {
      return;
    }
    const anon = anonId();

    function onMessage(e: MessageEvent) {
      // принимаем только от нашего iframe и с его домена
      if (e.origin !== origin || e.source !== frameRef.current?.contentWindow) return;
      const d = e.data;
      if (!d || typeof d !== 'object' || d.v !== 1 || typeof d.type !== 'string') return;

      if (d.type === 'trainer:height') {
        const h = Number(d.height);
        if (Number.isFinite(h)) setHeight(Math.min(MAX_H, Math.max(MIN_H, Math.round(h))));
        return;
      }

      if (d.type === 'trainer:result') {
        const lesson = String(d.lesson ?? '').slice(0, 80);
        const max = Math.round(Number(d.max));
        const score = Math.round(Number(d.score));
        if (!lesson || !Number.isFinite(max) || !Number.isFinite(score) || max <= 0 || max > 1000) return;
        // «первая попытка» считаем сами, а не верим тренажёру
        const key = `hub:sent:${assetId}:${lesson}`;
        const first = !getStored(key);
        setStored(key, '1');
        const display = (getStored(NAME_KEY) ?? '').trim().slice(0, 60) || null;
        db()
          .from('results')
          .insert({
            anon_id: anon,
            post_id: postId,
            asset_id: assetId,
            lesson,
            score: Math.min(Math.max(score, 0), max),
            max_score: max,
            first_try: first,
            display_name: display,
          })
          .then(({ error }) => {
            if (error) console.warn('result not saved', error.message);
          });
        return;
      }

      if (d.type === 'trainer:finish') {
        db()
          .from('events')
          .insert({ anon_id: anon, post_id: postId, asset_id: assetId, kind: 'finish' })
          .then(({ error }) => {
            if (error) console.warn('finish not saved', error.message);
          });
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [url, postId, assetId]);

  function saveName() {
    const v = name.trim().slice(0, 60);
    setStored(NAME_KEY, v || null);
    setName(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const frame = (
    <iframe
      ref={frameRef}
      className="trainer-frame"
      src={url}
      title={title}
      style={{ height: bare ? 'calc(100dvh - 120px)' : height ? `${height}px` : '85vh' }}
      // Отдельный домен => allow-same-origin даёт тренажёру ЕГО собственное
      // хранилище (прогресс), но не доступ к нашему сайту.
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      allow="autoplay; fullscreen"
      referrerPolicy="strict-origin-when-cross-origin"
      loading="lazy"
    />
  );

  const nameRow = (
    <div className="trainer-name">
      <label htmlFor={`name-${assetId}`}>Ваше имя (необязательно):</label>
      <input
        id={`name-${assetId}`}
        value={name}
        maxLength={60}
        placeholder="без имени — анонимно"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && saveName()}
      />
      <button className="btn" onClick={saveName}>
        {saved ? 'Сохранено ✓' : 'Сохранить'}
      </button>
    </div>
  );

  if (bare) {
    return (
      <>
        {nameRow}
        {frame}
      </>
    );
  }

  return (
    <section className="block" aria-label={title}>
      <div className="block-head">
        <b>{title}</b>
        {fullscreenHref && (
          <a className="btn" href={fullscreenHref}>
            ⛶ На весь экран
          </a>
        )}
      </div>
      {nameRow}
      {frame}
    </section>
  );
}
