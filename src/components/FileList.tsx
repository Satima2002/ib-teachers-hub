import { publicUrl } from '@/lib/supabase';
import { fmtSize } from '@/lib/format';
import type { Asset } from '@/lib/types';

export function FileList({ files, title = 'Файлы' }: { files: Asset[]; title?: string }) {
  if (!files.length) return null;
  return (
    <section className="block" aria-label={title}>
      <div className="block-head">
        <b>{title}</b>
      </div>
      <ul className="files">
        {files.map((f) => {
          const href = f.url ?? publicUrl(f.storage_path);
          if (!href) return null;
          return (
            <li key={f.id}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {f.title}
              </a>
              <span className="muted small">{fmtSize(f.size_bytes)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
