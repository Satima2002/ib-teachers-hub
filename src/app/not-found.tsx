import Link from 'next/link';
import { BoxIcon } from '@/components/Icons';
import { SiteHeader } from '@/components/SiteHeader';

export default function NotFound() {
  return (
    <>
      <SiteHeader active={null} />
      <div className="page" style={{ display: 'block', maxWidth: 720 }}>
        <div className="empty">
          <span className="ic">
            <BoxIcon />
          </span>
          <h2>Такого материала нет</h2>
          <p>Возможно, ссылка устарела или материал ещё не опубликован.</p>
          <Link className="btn dark" href="/">
            Все материалы
          </Link>
        </div>
      </div>
    </>
  );
}
