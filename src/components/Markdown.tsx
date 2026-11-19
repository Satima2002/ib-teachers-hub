import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { headingId } from '@/lib/content';

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (typeof node === 'object' && 'props' in (node as any)) return textOf((node as any).props.children);
  return '';
}

/**
 * Markdown без «сырого» HTML: react-markdown по умолчанию его не выполняет,
 * поэтому вставить скрипт в текст поста нельзя.
 */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => <h2 id={headingId(textOf(children))}>{children}</h2>,
          a: ({ href, children }) => {
            const external = !!href && /^https?:\/\//.test(href);
            return (
              <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
