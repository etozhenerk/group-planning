import { Link } from 'react-router';
import { useMobileLayout } from '@/shared/lib/media';
import { designTokens } from '@/shared/config/design-tokens';
import { CalendarPlus, Plus, Sparkles } from 'lucide-react';
import styles from '@/pages/meetings/ui/HomeEmpty/HomeEmpty.module.css';

export type HomeEmptyProps = { createPath: string; period?: 'upcoming' | 'past' };

export const HomeEmpty = ({ createPath, period = 'upcoming' }: HomeEmptyProps) => {
  const mobile = useMobileLayout();

  return (
    <section className={styles.empty} data-testid="home-empty" data-mobile={mobile}>
      {mobile ? (
        <CalendarPlus
          aria-hidden="true"
          size={Number.parseFloat(designTokens.componentMobileMeetingsEmptyGlyph)}
        />
      ) : (
        <Sparkles aria-hidden="true" size={44} />
      )}
      <h2>
        {mobile
          ? period === 'past'
            ? 'Нет прошедших встреч'
            : 'Нет предстоящих встреч'
          : 'С чего начнём?'}
      </h2>
      <p>
        {mobile
          ? 'После создания встречи отправьте ссылку друзьям.'
          : 'Создайте встречу и пригласите друзей по ссылке.'}
      </p>
      <Link className={styles.create} to={createPath}>
        {mobile && (
          <Plus
            size={Number.parseFloat(designTokens.componentMobileMeetingsCreateIconSize)}
            aria-hidden="true"
          />
        )}
        Создать встречу
      </Link>
    </section>
  );
};
