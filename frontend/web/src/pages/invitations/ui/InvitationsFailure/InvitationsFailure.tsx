import { CloudOff, RotateCw } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import { useMobileLayout } from '@/shared/lib/media';
import { Status } from '@/shared/ui/Status';

export type InvitationsFailureProps = { refresh: boolean; onRetry: () => void };

export const InvitationsFailure = ({ refresh, onRetry }: InvitationsFailureProps) => {
  const mobile = useMobileLayout();

  return (
    <Status
      title={
        refresh ? 'Не удалось обновить приглашения' : 'Не удалось загрузить приглашения'
      }
      error
      action={onRetry}
      variant={mobile ? (refresh ? 'refresh' : 'panel') : 'default'}
      icon={
        mobile ? (
          <CloudOff
            strokeWidth={designTokens.componentMobileStateGlyphStroke}
            size={Number.parseFloat(
              refresh
                ? designTokens.componentMobileStateRefreshGlyphSize
                : designTokens.componentMobileStateGlyphSize,
            )}
            aria-hidden="true"
          />
        ) : undefined
      }
      actionIcon={
        mobile ? (
          <RotateCw
            size={Number.parseFloat(
              refresh
                ? designTokens.componentMobileStateRefreshActionGlyphSize
                : designTokens.componentMobileStateActionIconSize,
            )}
            aria-hidden="true"
          />
        ) : undefined
      }
      actionLabel={
        mobile
          ? refresh
            ? 'Повторить обновление'
            : 'Повторить загрузку'
          : 'Попробовать снова'
      }
    />
  );
};
