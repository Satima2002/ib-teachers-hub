import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="wrap">
      <h1 className="title-hl">Не найдено</h1>
      <p className="lead">Такого материала нет, или он ещё не опубликован.</p>
      <Link className="btn primary" href="/">
        Все материалы
      </Link>
    </main>
  );
}
