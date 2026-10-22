import { Link } from 'react-router';
import { Sparkles } from 'lucide-react';
import styles from '@/pages/meetings/ui/HomeEmpty/HomeEmpty.module.css';

export const HomeEmpty = () => {
  return (
    <section className={styles.empty} data-testid="home-empty">
      <Sparkles aria-hidden="true" size={44} />
      <h2>С чего начнём?</h2>
      <p>Создайте встречу и пригласите друзей по ссылке.</p>
      <Link className={styles.create} to="/meetings/new">
        Создать встречу
      </Link>
    </section>
  );
};
