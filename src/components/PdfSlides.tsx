'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = { url: string; title: string; downloadUrl?: string | null; anchorId?: string };

/**
 * Презентация из PDF: листаемые слайды (pdf.js). Работает везде, включая iPhone.
 * Если что-то пошло не так — показываем ссылку на PDF.
 */
export function PdfSlides({ url, title, downloadUrl, anchorId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<any>(null);
  const renderRef = useRef<any>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // legacy-сборка содержит полифилы: работает и на старых iPhone (Safari < 17.4)
        const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
        const doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;
        docRef.current = doc;
        setPages(doc.numPages);
        setState('ready');
      } catch (e) {
        console.error('PDF', e);
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
      docRef.current?.destroy?.();
    };
  }, [url]);

  const draw = useCallback(async () => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;
    try {
      renderRef.current?.cancel?.();
      const p = await doc.getPage(page);
      const cssWidth = canvas.parentElement?.clientWidth || 800;
      const base = p.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = p.getViewport({ scale: (cssWidth / base.width) * dpr });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const task = p.render({ canvasContext: canvas.getContext('2d')!, viewport });
      renderRef.current = task;
      await task.promise;
    } catch (e: any) {
      if (e?.name !== 'RenderingCancelledException') console.error('PDF render', e);
    }
  }, [page]);

  useEffect(() => {
    if (state === 'ready') draw();
  }, [state, draw]);

  useEffect(() => {
    if (state !== 'ready') return;
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [state, draw]);

  const prev = () => setPage((p) => Math.max(1, p - 1));
  const next = () => setPage((p) => Math.min(pages, p + 1));

  return (
    <section className="block" id={anchorId} aria-label={title}>
      <div className="block-head">
        <span className="badge">Презентация</span>
        <b>{title}</b>
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <a className="btn sm" href={url} target="_blank" rel="noopener noreferrer">
            Открыть PDF
          </a>
          {downloadUrl && (
            <a className="btn sm" href={downloadUrl} download>
              Скачать .pptx
            </a>
          )}
        </span>
      </div>
      <div
        className="slides"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') prev();
          if (e.key === 'ArrowRight') next();
        }}
      >
        {state === 'loading' && <p className="muted">Загружаю слайды…</p>}
        {state === 'error' && (
          <p className="muted">
            Не удалось показать слайды здесь.{' '}
            <a href={url} target="_blank" rel="noopener noreferrer">
              Откройте PDF
            </a>
            .
          </p>
        )}
        <canvas ref={canvasRef} hidden={state !== 'ready'} aria-label={`Слайд ${page} из ${pages}`} />
        {state === 'ready' && (
          <div className="nav-row">
            <button className="btn" onClick={prev} disabled={page <= 1}>
              ← Назад
            </button>
            <span className="muted small">
              {page} / {pages}
            </span>
            <button className="btn dark" onClick={next} disabled={page >= pages}>
              Дальше →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
