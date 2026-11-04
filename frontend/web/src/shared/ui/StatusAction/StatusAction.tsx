import { Link } from 'react-router';
import type { ReactNode } from 'react';
import styles from '@/shared/ui/StatusAction/StatusAction.module.css';

export type StatusActionProps = {
  label: string;
  onClick?: () => void;
  to?: string;
  icon?: ReactNode;
  variant: 'default' | 'panel' | 'refresh';
};

export const StatusAction = ({
  label,
  onClick,
  to,
  icon,
  variant,
}: StatusActionProps) => {
  const content = (
    <>
      {icon}
      {variant !== 'refresh' && label}
    </>
  );

  return to ? (
    <Link className={styles.action} data-variant={variant} to={to} aria-label={label}>
      {content}
    </Link>
  ) : (
    <button
      className={styles.action}
      data-variant={variant}
      type="button"
      onClick={onClick}
      aria-label={label}
    >
      {content}
    </button>
  );
};
