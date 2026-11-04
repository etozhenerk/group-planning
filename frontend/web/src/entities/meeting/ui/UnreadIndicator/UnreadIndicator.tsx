import { MessageCircle } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import { unreadLabel, unreadNotice } from '@/entities/meeting/lib/unreadLabel';
import styles from '@/entities/meeting/ui/UnreadIndicator/UnreadIndicator.module.css';

export type UnreadIndicatorProps = {
  count: string | undefined;
  variant?: 'count' | 'notice';
  flow?: boolean;
};

export const UnreadIndicator = ({
  count,
  variant = 'count',
  flow = false,
}: UnreadIndicatorProps) =>
  count !== undefined && BigInt(count) > 0n ? (
    <span
      className={variant === 'notice' ? styles.notice : styles.badge}
      data-flow={flow}
      aria-label={unreadLabel(count)}
      title={variant === 'notice' ? unreadLabel(count) : undefined}
    >
      {variant === 'notice' ? (
        <>
          <MessageCircle
            size={Number.parseFloat(designTokens.componentMobileUnreadIconSize)}
            strokeWidth={designTokens.componentMobileUnreadIconStrokeWidth}
            aria-hidden="true"
          />
          <span>{unreadNotice(count)}</span>
        </>
      ) : (
        count
      )}
    </span>
  ) : null;
