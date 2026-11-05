import styles from '@/shared/ui/Brand/Brand.module.css';
import { Link } from 'react-router';

export type BrandProps = {
  variant?: 'default' | 'navigation' | 'header' | 'mobile' | 'result' | 'confirmation';
};

export const Brand = ({ variant = 'default' }: BrandProps) => {
  return (
    <Link
      to="/"
      className={[styles.brand, styles[`in-${variant}`]].filter(Boolean).join(' ')}
      aria-label="Somewhere — на главную"
    >
      <img src="/somewhere.svg" alt="" width="34" height="34" />
      <span>somewhere</span>
    </Link>
  );
};
