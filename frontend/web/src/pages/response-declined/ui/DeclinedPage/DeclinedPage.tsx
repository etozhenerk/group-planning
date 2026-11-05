import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { declinedConfirmation } from '@/pages/response-declined/model/declinedConfirmation';
import { useSession } from '@/entities/session';
import { PublicHeader } from '@/widgets/public-header';
import { Brand } from '@/shared/ui/Brand';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { Status } from '@/shared/ui/Status';
import styles from '@/pages/response-declined/ui/DeclinedPage/DeclinedPage.module.css';

export const DeclinedPage = () => {
  const location = useLocation();
  const session = useSession();
  const result = declinedConfirmation.safeParse(location.state);
  const confirmed =
    result.success && result.data.declinedUserId === session.data?.user.id;

  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (confirmed) {
      heading.current?.focus();
    }
  }, [confirmed]);

  return (
    <div className={styles.screen}>
      <div className={styles.desktopHeader}>
        <PublicHeader result />
      </div>
      <header className={styles.mobileHeader}>
        <Brand variant="confirmation" />
      </header>
      <main id="main" className={styles.card}>
        {confirmed ? (
          <>
            <span className={styles.icon}>
              <ChatIcon name="check" size="100%" />
            </span>
            <h1 ref={heading} tabIndex={-1}>
              Вы ответили «Не смогу»
            </h1>
            <p className={styles.meeting}>{result.data.declinedMeetingTitle}</p>
            <p className={styles.copy}>Организатор увидит ваш ответ.</p>
          </>
        ) : (
          <Status
            title={session.isPending ? 'Проверка ответа' : 'Подтверждение недоступно'}
            text={
              session.isPending
                ? 'Проверяем вход…'
                : 'Откройте исходное приглашение, чтобы проверить ваш ответ.'
            }
          />
        )}
        <Link className={styles.action} to="/meetings" replace>
          К моим встречам
        </Link>
      </main>
    </div>
  );
};
