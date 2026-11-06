import { Link } from 'react-router';
import type { LinkProps } from 'react-router';
import type { ReactNode } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import { designTokens } from '@/shared/config/design-tokens';
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
      {mobile ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width={Number.parseFloat(designTokens.componentMobileBackIconSize)}
          height={Number.parseFloat(designTokens.componentMobileBackIconSize)}
          fill="none"
          stroke="currentColor"
          strokeWidth={designTokens.componentMobileBackStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 5-7 7 7 7" />
        </svg>
      ) : (
        (children ?? '← Назад')
      )}
    </Link>
  );
};
