import type { ReactNode } from 'react';
import { StatusAction } from '@/shared/ui/StatusAction';
import styles from '@/shared/ui/Status/Status.module.css';

export type StatusProps = {
  title: string;
  text?: string;
  error?: boolean;
  action?: () => void;
  actionLabel?: string;
  actionTo?: string;
  actionIcon?: ReactNode;
  icon?: ReactNode;
  variant?: 'default' | 'panel' | 'refresh';
  size?: 'normal' | 'large';
};

export const Status = ({
  title,
  text,
  error = false,
  action,
  actionLabel = 'Попробовать снова',
  actionTo,
  actionIcon,
  icon,
  variant = 'default',
  size = 'normal',
}: StatusProps) => (
  <section
    className={styles.state}
    role={error ? 'alert' : 'status'}
    data-variant={variant}
    data-size={size}
  >
    {icon && (
      <div className={styles.symbol} aria-hidden="true">
        {icon}
      </div>
    )}
    <h2>{title}</h2>
    {text && <p className={styles.muted}>{text}</p>}
    {(action || actionTo) && (
      <StatusAction
        label={actionLabel}
        {...(action ? { onClick: action } : {})}
        {...(actionTo ? { to: actionTo } : {})}
        icon={actionIcon}
        variant={variant}
      />
    )}
  </section>
);
