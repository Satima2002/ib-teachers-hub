'use client';

import { useState } from 'react';

type Props = { url: string; qrSvg: string | null };

/** QR-код поста и кнопка «Поделиться» (пока один вариант — короткая ссылка) */
export function SharePanel({ url, qrSvg }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const short = url.replace(/^https?:\/\//, '');

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.getElementById('share-link') as HTMLInputElement | null;
      el?.select();
      document.execCommand?.('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="share" aria-label="Поделиться">
      <h3 className="label">QR-КОД НА ЭТОТ МАТЕРИАЛ</h3>
      {qrSvg && <div className="qr" role="img" aria-label={`QR-код: ${short}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />}
      <button className="btn sm" style={{ width: '100%' }} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Поделиться
      </button>
      {open && (
        <div className="share-link">
          <input id="share-link" readOnly value={short} onFocus={(e) => e.currentTarget.select()} aria-label="Короткая ссылка" />
          <button className="btn sm dark" onClick={copy}>
            {copied ? 'Скопировано ✓' : 'Скопировать'}
          </button>
        </div>
      )}
    </section>
  );
}
