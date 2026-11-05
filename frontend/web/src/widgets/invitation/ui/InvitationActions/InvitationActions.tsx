import { designTokens } from '@/shared/config/design-tokens';
import { AuthNotice, SignInButton } from '@/features/sign-in';
import { InvitationAnswer, ResponseButtons } from '@/features/respond';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Status } from '@/shared/ui/Status';
import { errorText } from '@/shared/api';
import { useMobileLayout } from '@/shared/lib/media';
import type { Invitation } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import styles from '@/widgets/invitation/ui/InvitationActions/InvitationActions.module.css';

export type InvitationActionsProps = {
  invitation: Invitation;
  token?: string | undefined;
  session: Session | null;
  sessionPending: boolean;
  sessionError: unknown;
  retrySession: () => void;
  recovery?: boolean | undefined;
};

export const InvitationActions = ({
  invitation,
  token,
  session,
  sessionPending,
  sessionError,
  retrySession,
  recovery,
}: InvitationActionsProps) => {
  const mobile = useMobileLayout();

  return (
    <div className={styles.stack} data-mobile={mobile}>
      {mobile && <AuthNotice />}
      {sessionPending ? (
        <div role="status" aria-label="Проверка входа" aria-busy="true">
          <Skeleton
            width={designTokens.componentInvitationDesktopAuthSkeletonWidth}
            height={Number.parseFloat(designTokens.targetWeb)}
          />
        </div>
      ) : sessionError ? (
        <Status
          title="Не удалось проверить вход"
          text={errorText(sessionError)}
          error
          action={retrySession}
        />
      ) : session ? (
        <>
          {!mobile && (
            <p className={styles.muted}>Вы вошли как {session.user.displayName}</p>
          )}
          {recovery ? (
            <ResponseButtons
              session={session}
              id={invitation.meetingId}
              title={invitation.title}
              preview={invitation}
              {...(token ? { token } : {})}
              expected={invitation.myRsvpRevision}
              current={invitation.myRsvp}
            />
          ) : (
            <InvitationAnswer
              session={session}
              invitation={invitation}
              token={token ?? ''}
            />
          )}
        </>
      ) : (
        <>
          {mobile && <p className={styles.hint}>Вход не подтверждает участие.</p>}
          <SignInButton
            errorNotice={mobile}
            fullWidth={mobile}
            context={{ kind: 'invitation', token: token ?? '' }}
            label={mobile ? 'Войти через Яндекс ID' : 'Войти и ответить'}
          />
          {!mobile && (
            <p className={styles.muted}>
              Вход не подтверждает участие. Ответ можно выбрать после входа.
            </p>
          )}
        </>
      )}
    </div>
  );
};
