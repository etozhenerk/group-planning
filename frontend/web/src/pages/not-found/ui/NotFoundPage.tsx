import { Link } from 'react-router';

export const NotFoundPage = () => {
  return (
    <main id="main" className="entry-page stack">
      <h1>Страница не найдена</h1>
      <p>Проверьте ссылку или откройте свои встречи.</p>
      <Link to="/meetings" className="button primary">
        Мои встречи
      </Link>
    </main>
  );
};
