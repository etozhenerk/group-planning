import { Navigate } from 'react-router';
import { Sparkles } from 'lucide-react';
import { useSession } from '@/entities/session';
import { SignInButton } from '@/features/sign-in';
import { PublicHeader } from '@/widgets/public-header';
import { Brand } from '@/shared/ui/brand';
import { HeroConversation } from '@/pages/landing/ui/HeroConversation';
import { ExampleCard } from '@/pages/landing/ui/ExampleCard';
import '@/pages/landing/ui/landing.css';

export const LandingPage = () => {
  const session = useSession();

  if (session.data) {
    return <Navigate to="/meetings" replace />;
  }

  return (
    <div className="landing">
      <PublicHeader landing />
      <main id="main">
        <section className="landing-hero">
          <div>
            <span className="eyebrow">
              <Sparkles aria-hidden="true" size={16} />
              Встречи с друзьями
            </span>
            <h1>
              Кто придёт,
              <br />
              где встречаемся
              <br />
              <span>и кто что принесёт.</span>
            </h1>
            <p>
              Создайте встречу в Somewhere и отправьте ссылку друзьям. Ответы и обсуждение
              будут собраны в её ленте.
            </p>
            <SignInButton context={{ kind: 'home' }} label="Попробовать" />
            <small className="login-caption">Вход через Яндекс ID</small>
          </div>
          <HeroConversation />
        </section>
        <section id="examples" className="examples" aria-label="Как работает Somewhere">
          <ExampleCard
            title="Ответы на приглашение"
            description="Друзья выбирают «Приду», «Возможно» или «Не смогу». Общий чат открывается после ответа «Приду»."
            before="/example-rsvp.png"
            alt="Приглашение на встречу с датой, местом и тремя вариантами ответа"
          />
          <ExampleCard
            title="Смена места"
            description="После завершения опроса место меняется автоматически, если большинство проголосовавших поддержало предложение."
            before="/example-poll-before.png"
            after="/example-poll-after.png"
            labels={['Опрос открыт', 'После завершения']}
            alt="Пример голосования о новом месте встречи"
            coming
          />
          <ExampleCard
            title="Задачи подготовки"
            description="Предложите другу заказать пиццу. Ответственным он станет, когда сам примет задачу."
            before="/example-task-before.png"
            after="/example-task-after.png"
            labels={['Предложена', 'Принята']}
            alt="Пример предложенной и принятой задачи заказать пиццу"
            coming
          />
          <ExampleCard
            title="Список и календарь"
            description="Встречи будут доступны списком и в календаре. События без итоговой даты показаны отдельно."
            before="/example-calendar.png"
            alt="Пример календаря с двумя встречами в выбранный день"
            coming
          />
        </section>
        <div className="landing-bottom">
          <SignInButton context={{ kind: 'home' }} label="Попробовать" />
        </div>
      </main>
      <footer>
        <Brand />
      </footer>
    </div>
  );
};
