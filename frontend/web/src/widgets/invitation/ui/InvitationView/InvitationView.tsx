import type { ReactNode } from 'react';
import type { Invitation } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { SkeletonDetails } from '@/shared/ui/SkeletonDetails';
import { Status } from '@/shared/ui/Status';
import { errorText } from '@/shared/api';
import { InvitationSurface } from '@/widgets/invitation/ui/InvitationSurface';
import { InvitationReady } from '@/widgets/invitation/ui/InvitationReady';
import { InvitationUnavailable } from '@/widgets/invitation/ui/InvitationUnavailable';
import { useMobileLayout } from '@/shared/lib/media';
import { InvitationReturn } from '@/widgets/invitation/ui/InvitationReturn';

export type InvitationViewProps = {
  invitation: Invitation | null;
  token?: string | undefined;
  loading: boolean;
  error: unknown;
  retry: () => void;
  header: ReactNode;
  session: Session | null;
  sessionPending: boolean;
  sessionError: unknown;
  retrySession: () => void;
  recovery?: boolean | undefined;
};

export const InvitationView = (props: InvitationViewProps) => {
  const mobile = useMobileLayout();

  return props.invitation ? (
    <InvitationReady {...props} invitation={props.invitation} />
  ) : (
    <InvitationSurface
      header={props.header}
      card={props.loading}
      footer={!mobile && <InvitationReturn signedIn={!!props.session} />}
    >
      {props.loading ? (
        <SkeletonDetails label="Загрузка приглашения" />
      ) : mobile ? (
        <InvitationUnavailable retry={props.retry} />
      ) : (
        <Status
          title="Приглашение недоступно"
          text={errorText(props.error)}
          error
          action={props.retry}
        />
      )}
    </InvitationSurface>
  );
};
