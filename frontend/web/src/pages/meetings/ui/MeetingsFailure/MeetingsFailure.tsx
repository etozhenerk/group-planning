import { CloudOff, RotateCw } from 'lucide-react';
import { useMobileLayout } from '@/shared/lib/media';
import { designTokens } from '@/shared/config/design-tokens';
import { Status } from '@/shared/ui/Status';

export type MeetingsFailureProps = {
  title: string;
  refresh: boolean;
  onRetry: () => void;
};

export const MeetingsFailure = ({ title, refresh, onRetry }: MeetingsFailureProps) => {
  const mobile = useMobileLayout();

  return (
    <Status
      title={title}
      error
      variant={mobile ? (refresh ? 'refresh' : 'panel') : 'default'}
      size="large"
      icon={
        mobile ? (
          <CloudOff
            strokeWidth={designTokens.componentMobileStateGlyphStroke}
            size={Number.parseFloat(
              refresh
                ? designTokens.componentMobileStateRefreshGlyphSize
                : designTokens.componentMobileStateLargeGlyphSize,
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
      action={onRetry}
    />
  );
};
