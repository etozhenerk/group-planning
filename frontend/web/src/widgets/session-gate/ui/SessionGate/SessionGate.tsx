import { useIsMutating } from '@tanstack/react-query';
import styles from '@/widgets/session-gate/ui/SessionGate/SessionGate.module.css';
import type { ReactNode } from 'react';
import { Brand } from '@/shared/ui/Brand';
import { Status } from '@/shared/ui/Status';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';
import { SignInButton, AuthNotice } from '@/features/sign-in';
import type { ReturnContext } from '@/features/sign-in';
import { useSession } from '@/entities/session';
import type { Session } from '@/entities/session';
import { errorText } from '@/shared/api';

export type SessionGateProps = {
  children: (session: Session) => ReactNode;
  context?: ReturnContext;
  loading?: ReactNode;
};

export const SessionGate = ({
  children,
  context = { kind: 'home' },
  loading = <LoadingScreen />,
}: SessionGateProps) => {
  const session = useSession();
  const leaving = useIsMutating({ mutationKey: ['logout'] }) > 0;

  if (session.isPending || (leaving && !session.data)) {
    return loading;
  }

  if (session.error) {
    return (
      <main id="main" className={styles['entry-page']}>
        <Status
          title="Не удалось проверить вход"
          text={errorText(session.error)}
          error
          action={() => void session.refetch()}
        />
      </main>
    );
  }

  if (!session.data) {
    return (
      <main id="main" className={[styles['entry-page'], styles['stack']].join(' ')}>
        <Brand />
        <h1>Ваши встречи</h1>
        <p className={styles['muted']}>
          Войдите, чтобы создавать встречи и отвечать на приглашения.
        </p>
        <AuthNotice />
        <SignInButton context={context} />
      </main>
    );
  }

  return children(session.data);
};
