'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/supabase';
import { anonId, getStored, setStored } from '@/lib/anon';

const QUESTIONS = [
  { key: 'liked', title: 'Понравилось', hint: 'Какой лайфхак вы попробуете первым?' },
  { key: 'thoughts', title: 'Что думаете', hint: 'Ваше мнение о материале: что полезно, что лишнее?' },
  { key: 'missing', title: 'Не хватило', hint: 'Какой темы или примеров вам не хватило?' },
] as const;

type Key = (typeof QUESTIONS)[number]['key'];

/** Рефлексия под постом. Ответы видит только автор (в Supabase). */
export function Reflection({ postId }: { postId: string }) {
  const doneKey = `hub:reflected:${postId}`;
  const [values, setValues] = useState<Record<Key, string>>({ liked: '', thoughts: '', missing: '' });
  const [name, setName] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    setName(getStored('hub:name') ?? '');
    if (getStored(doneKey)) setState('done');
  }, [doneKey]);

  const clean = (v: string) => v.trim().slice(0, 1000) || null;
  const empty = QUESTIONS.every((q) => !values[q.key].trim());

  async function send(e: { preventDefault(): void }) {
    e.preventDefault();
    if (empty || state === 'sending') return;
    setState('sending');
    const display = name.trim().slice(0, 60) || null;
    setStored('hub:name', display);
    const { error } = await db().from('reflections').insert({
      anon_id: anonId(),
      post_id: postId,
      display_name: display,
      liked: clean(values.liked),
      thoughts: clean(values.thoughts),
      missing: clean(values.missing),
    });
    if (error) {
      console.warn('reflection not saved', error.message);
      setState('error');
      return;
    }
    setStored(doneKey, '1');
    setState('done');
  }

  if (state === 'done') {
    return (
      <section className="block reflect" id="reflection" aria-label="Рефлексия">
        <div className="block-head">
          <span className="badge">Рефлексия</span>
          <b>Спасибо за ответ!</b>
        </div>
        <p className="reflect-note">Ваш ответ получен. Он поможет сделать материал лучше.</p>
      </section>
    );
  }

  return (
    <section className="block reflect" id="reflection" aria-label="Рефлексия">
      <div className="block-head">
        <span className="badge">Рефлексия</span>
        <b>Пара слов о материале</b>
      </div>
      <form onSubmit={send}>
        <p className="reflect-note">Ответы видит только автор. Можно ответить на один вопрос.</p>
        {QUESTIONS.map((q, i) => (
          <label key={q.key} className="reflect-q">
            <span>
              <b>
                {i + 1}. {q.title}
              </b>{' '}
              <span className="muted">{q.hint}</span>
            </span>
            <textarea
              rows={2}
              maxLength={1000}
              value={values[q.key]}
              onChange={(e) => setValues((v) => ({ ...v, [q.key]: e.target.value }))}
            />
          </label>
        ))}
        <div className="reflect-foot">
          <input
            value={name}
            maxLength={60}
            placeholder="Имя (необязательно)"
            aria-label="Имя (необязательно)"
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn dark" type="submit" disabled={empty || state === 'sending'}>
            {state === 'sending' ? 'Отправляю…' : 'Отправить'}
          </button>
        </div>
        {state === 'error' && <p className="reflect-note" style={{ color: '#a33' }}>Не получилось отправить. Попробуйте ещё раз.</p>}
      </form>
    </section>
  );
}
