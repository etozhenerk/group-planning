import { SkeletonDetails } from '@/shared/ui/SkeletonDetails';
import { Skeleton } from '@/shared/ui/Skeleton';
import styles from '@/pages/invitation/ui/InvitationPage/InvitationPage.module.css';
import { Link, useParams } from 'react-router';
import { PublicHeader } from '@/widgets/public-header';
import { useSession } from '@/entities/session';
import { MeetingFacts, MeetingCover } from '@/entities/meeting';
import { SignInButton, AuthNotice } from '@/features/sign-in';
import { InvitationResponse } from '@/pages/invitation/ui/InvitationResponse';
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
            <p className={styles['eyebrow']}>Приглашение на встречу</p>
            <h1>{query.data.title}</h1>
            {query.data.coverUrl && (
              <MeetingCover url={query.data.coverUrl} meeting={query.data.meetingId} />
            )}
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
                <InvitationResponse
                  session={session.data}
                  invitation={query.data}
                  token={token}
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
        <Link
          to={session.data ? '/invitations' : '/'}
          className={[styles['button'], styles['ghost']].join(' ')}
        >
          {session.data ? 'К приглашениям' : 'О somewhere'}
        </Link>
      </main>
    </div>
  );
};
