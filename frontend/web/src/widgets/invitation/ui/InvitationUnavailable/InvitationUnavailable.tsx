import { CloudOff, RotateCw } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import { StatusAction } from '@/shared/ui/StatusAction';
import styles from '@/widgets/invitation/ui/InvitationUnavailable/InvitationUnavailable.module.css';

export type InvitationUnavailableProps = { retry: () => void };

export const InvitationUnavailable = ({ retry }: InvitationUnavailableProps) => (
  <section className={styles.panel} role="alert">
    <span className={styles.icon} aria-hidden="true">
      <CloudOff
        size={designTokens.componentMobileStateGlyphSize}
        strokeWidth={designTokens.componentMobileStateGlyphStroke}
      />
    </span>
    <h1>Приглашение недоступно</h1>
    <StatusAction
      label="Повторить загрузку"
      onClick={retry}
      variant="panel"
      icon={
        <RotateCw
          size={designTokens.componentInvitationStateUnavailableActionIcon}
          aria-hidden="true"
        />
      }
    />
  </section>
);
