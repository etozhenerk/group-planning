import { SkeletonDetails } from '@/shared/ui/SkeletonDetails';
import { Skeleton } from '@/shared/ui/Skeleton';
import styles from '@/pages/invitation/ui/InvitationPage/InvitationPage.module.css';
import { Link, useParams } from 'react-router';
import { PublicHeader } from '@/widgets/public-header';
import { useSession } from '@/entities/session';
import { MeetingFacts } from '@/entities/meeting';
import { SignInButton, AuthNotice } from '@/features/sign-in';
import { ResponseButtons } from '@/features/respond';
import { Status } from '@/shared/ui/Status';
import { errorText } from '@/shared/api';
import { useInvite } from '@/pages/invitation/ui/InvitationPage/hooks/useInvite';

export const InvitationPage = () => {
  const { token = '' } = useParams();
  const session = useSession();
  const query = useInvite(token, session.data?.user.id ?? '');

  return (
    <div className={styles['public-page']}>
      <PublicHeader />
      <main id="main" className={styles['invitation-page']}>
        {query.isPending ? (
          <div className={styles['invitation-card']}>
            <SkeletonDetails label="Загрузка приглашения" />
          </div>
        ) : !query.data ? (
          <Status
            title="Приглашение недоступно"
            text={errorText(query.error)}
            error
            action={() => void query.refetch()}
          />
        ) : (
          <div className={[styles['invitation-card'], styles['stack']].join(' ')}>
            <AuthNotice />
            <p className={styles['eyebrow']}>Вас приглашают на встречу</p>
            <h1>{query.data.title}</h1>
            <MeetingFacts
              startsAt={query.data.startsAt}
              startsOn={query.data.startsOn ?? null}
              timezone={query.data.timezone}
              place={query.data.place}
            />
            {query.data.description && (
              <p className={styles['meeting-description']}>{query.data.description}</p>
            )}
            {session.isPending ? (
              <div role="status" aria-label="Проверка входа" aria-busy="true">
                <Skeleton width={220} height={44} />
              </div>
            ) : session.error ? (
              <Status
                title="Не удалось проверить вход"
                text={errorText(session.error)}
                error
                action={() => void session.refetch()}
              />
            ) : session.data ? (
              <>
                <p className={styles['muted']}>
                  Вы вошли как {session.data.user.displayName}
                </p>
                <ResponseButtons
                  session={session.data}
                  id={query.data.meetingId}
                  token={token}
                  expected={query.data.myRsvpRevision}
                  current={query.data.myRsvp}
                />
              </>
            ) : (
              <>
                <SignInButton
                  context={{ kind: 'invitation', token }}
                  label="Войти и ответить"
                />
                <p className={styles['muted']}>
                  Вход не подтверждает участие. Ответ можно выбрать после входа.
                </p>
              </>
            )}
          </div>
        )}
        <Link to="/" className={[styles['button'], styles['ghost']].join(' ')}>
          О Somewhere
        </Link>
      </main>
    </div>
  );
};
