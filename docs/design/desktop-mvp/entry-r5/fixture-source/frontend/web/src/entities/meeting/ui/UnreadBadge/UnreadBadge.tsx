import { unreadLabel } from '@/entities/meeting/lib/unreadLabel';
import styles from '@/entities/meeting/ui/UnreadBadge/UnreadBadge.module.css';

export type UnreadBadgeProps = { count: string | undefined };

export const UnreadBadge = ({ count }: UnreadBadgeProps) =>
  count !== undefined && BigInt(count) > 0n ? (
    <span className={styles.badge} aria-label={unreadLabel(count)}>
      {count}
    </span>
  ) : null;
