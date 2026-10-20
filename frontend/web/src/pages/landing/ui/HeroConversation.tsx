import { Sparkles } from 'lucide-react';
import { Avatar } from '@/shared/ui/avatar';

export const HeroConversation = () => {
  return (
    <div className="hero-demo" aria-label="Пример разговора друзей">
      <div className="hero-demo-card">
        <div className="row">
          <span className="meeting-emblem">
            <Sparkles aria-hidden="true" size={24} />
          </span>
          <div>
            <strong>Суббота без спешки</strong>
            <small>24 октября · 19:00 · вас 5</small>
          </div>
        </div>
        <div className="example-message">
          <Avatar name="Лена" size="small" />
          <div>
            <strong>Лена</strong>
            <p>
              Может, соберёмся у Саши?
              <br />У него большой стол.
            </p>
          </div>
        </div>
        <div className="example-message">
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
