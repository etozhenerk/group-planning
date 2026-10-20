import styles from '@/pages/not-found/ui/NotFoundPage/NotFoundPage.module.css';
import { Link } from 'react-router';

export const NotFoundPage = () => {
  return (
    <main id="main" className={[styles['entry-page'], styles['stack']].join(' ')}>
      <h1>Страница не найдена</h1>
      <p>Проверьте ссылку или откройте свои встречи.</p>
      <Link to="/meetings" className={[styles['button'], styles['primary']].join(' ')}>
        Мои встречи
      </Link>
    </main>
  );
};
