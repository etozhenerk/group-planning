import { Link, useParams } from 'react-router';
import { PublicHeader } from '@/widgets/public-header';
import { useSession } from '@/entities/session';
import { MeetingFacts } from '@/entities/meeting';
import { SignInButton, AuthNotice } from '@/features/sign-in';
import { ResponseButtons } from '@/features/respond';
import { Status } from '@/shared/ui/status';
import { errorText } from '@/shared/api';
import { useInvite } from '@/pages/invitation/model/useInvite';

export const InvitationPage = () => {
  const { token = '' } = useParams();
  const session = useSession();
  const query = useInvite(token, session.data?.user.id ?? '');

  return (
    <div className="public-page">
      <PublicHeader />
      <main id="main" className="invitation-page">
        {query.isPending ? (
          <Status title="Открываем приглашение…" />
        ) : !query.data ? (
          <Status
            title="Приглашение недоступно"
            text={errorText(query.error)}
            error
            action={() => void query.refetch()}
          />
        ) : (
          <div className="invitation-card stack">
            <AuthNotice />
            <p className="eyebrow">Вас приглашают на встречу</p>
            <h1>{query.data.title}</h1>
            <MeetingFacts
              startsAt={query.data.startsAt}
              timezone={query.data.timezone}
              place={query.data.place}
            />
            {query.data.description && (
              <p className="meeting-description">{query.data.description}</p>
            )}
            {session.isPending ? (
              <p role="status">Проверяем вход…</p>
            ) : session.error ? (
              <Status
                title="Не удалось проверить вход"
                text={errorText(session.error)}
                error
                action={() => void session.refetch()}
              />
            ) : session.data ? (
              <>
                <p className="muted">Вы вошли как {session.data.user.displayName}</p>
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
                <p className="muted">
                  Вход не подтверждает участие. Ответ можно выбрать после входа.
                </p>
              </>
            )}
          </div>
        )}
        <Link to="/" className="button ghost">
          О Somewhere
        </Link>
      </main>
    </div>
  );
};
