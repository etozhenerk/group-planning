import styles from '@/pages/landing/ui/HeroConversation/HeroConversation.module.css';
import { Sparkles } from 'lucide-react';
import { Avatar } from '@/shared/ui/Avatar';

export const HeroConversation = () => {
  return (
    <div className={styles['hero-demo']} aria-label="Пример разговора друзей">
      <div className={styles['hero-demo-card']}>
        <div className={styles['row']}>
          <span className={styles['meeting-emblem']}>
            <Sparkles aria-hidden="true" size={24} />
          </span>
          <div>
            <strong>Суббота без спешки</strong>
            <small>24 октября · 19:00 · вас 5</small>
          </div>
        </div>
        <div className={styles['example-message']}>
          <Avatar name="Лена" size="small" />
          <div>
            <strong>Лена</strong>
            <p>
              Может, соберёмся у Саши?
              <br />У него большой стол.
            </p>
          </div>
        </div>
        <div className={styles['example-message']}>
          <Avatar name="Миша" size="small" />
          <div>
            <strong>Миша</strong>
            <p>Настолки возьму! Кто умеет в «Каркассон»?</p>
          </div>
        </div>
      </div>
    </div>
  );
};
