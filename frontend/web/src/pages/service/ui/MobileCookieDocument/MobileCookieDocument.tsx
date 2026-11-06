import { readReturnLocation } from '@/shared/lib/navigation';
import { Link, useLocation } from 'react-router';
import styles from '@/pages/service/ui/MobileCookieDocument/MobileCookieDocument.module.css';

export const MobileCookieDocument = () => {
  const location = useLocation(),
    back = readReturnLocation(location.state, '/profile');

  return (
    <>
      <div className={styles.intro} id="cookies-purpose">
        <div>
          <h2>Чтобы сохранять ваш вход</h2>
          <p>
            Cookie помогают узнавать вас после входа и защищать авторизацию. Локальное
            хранилище сохраняет черновик и выбранный день календаря.
          </p>
        </div>
      </div>
      <article className={styles.copy}>
        <section id="cookies-storage">
          <h2 tabIndex={-1}>Что используется сейчас</h2>
          <div className={styles.table}>
            {[
              [
                'Вход в аккаунт',
                'Сохраняет авторизацию между запросами и посещениями.',
                'До 30 дней',
              ],
              [
                'Защита входа',
                'Связывает попытку входа через Яндекс ID с этим браузером.',
                'До 10 минут',
              ],
              [
                'Данные вкладки',
                'Черновик встречи, контекст приглашения и выбор календаря.',
                'В пределах сеанса вкладки*',
              ],
              [
                'Недавние эмодзи',
                'Сохраняет недавно выбранные эмодзи на этом устройстве.',
                'До удаления данных сайта',
              ],
            ].map(([title, text, time]) => (
              <div key={title}>
                <strong>{title}</strong>
                <p>{text}</p>
                <span>{time}</span>
              </div>
            ))}
          </div>
          <p className={styles.caption}>
            *Браузер может восстановить сеанс вкладки. Данные сайта можно удалить в
            настройках браузера.
          </p>
        </section>
        <section id="cookies-analytics">
          <h2 tabIndex={-1}>Реклама и аналитика</h2>
          <p>
            Эти cookie не используются для рекламы или отслеживания поведения. На
            страницах Яндекса действуют правила Яндекса.
          </p>
        </section>
        <section id="cookies-control">
          <h2 tabIndex={-1}>Как управлять</h2>
          <p>
            Выйдите из аккаунта, чтобы завершить текущую авторизацию. Данные сайта можно
            удалить в настройках браузера; после удаления cookie потребуется войти заново.
          </p>
          <Link
            to="/privacy"
            state={{ returnTo: '/cookies', returnState: { returnTo: back.path } }}
          >
            Политика конфиденциальности
          </Link>
        </section>
        <section id="cookies-consent">
          <h2 tabIndex={-1}>Согласие и сохранение входа</h2>
          <p className={styles.unfilled}>
            Окончательный способ получения согласия определим после выбора страны.
            Длительное сохранение входа оценивается отдельно от cookie, необходимого на
            время посещения.
          </p>
        </section>
      </article>
    </>
  );
};
