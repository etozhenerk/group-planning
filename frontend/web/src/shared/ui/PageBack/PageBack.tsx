import { Link } from 'react-router';
import type { LinkProps } from 'react-router';
import type { ReactNode } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import { BackIcon } from '@/shared/ui/BackIcon';
import styles from '@/shared/ui/PageBack/PageBack.module.css';

export type PageBackProps = {
  to: LinkProps['to'];
  state?: unknown;
  label: string;
  variant?: 'service' | 'create';
  children?: ReactNode;
  onClick?: LinkProps['onClick'];
};

export const PageBack = ({
  to,
  state,
  label,
  variant = 'service',
  children,
  onClick,
}: PageBackProps) => {
  const mobile = useMobileLayout();

  return (
    <Link
      className={styles.back}
      to={to}
      state={state}
      onClick={onClick}
      aria-label={mobile ? label : undefined}
      data-mobile={mobile}
      data-variant={variant}
    >
      {mobile ? <BackIcon /> : (children ?? '← Назад')}
    </Link>
  );
};
