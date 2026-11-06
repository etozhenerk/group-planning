import { PageBack } from '@/shared/ui/PageBack';
import { readReturnLocation, returnLocationLabel } from '@/shared/lib/navigation';
import { useLocation } from 'react-router';
import styles from '@/features/support-feedback/ui/MobilePageHeader/MobilePageHeader.module.css';

export type MobilePageHeaderProps = { title: string; form?: boolean; success?: boolean };

export const MobilePageHeader = ({
  title,
  form = false,
  success = false,
}: MobilePageHeaderProps) => {
  const location = useLocation();
  const back = readReturnLocation(location.state, '/help');

  return (
    <header className={styles.header}>
      <PageBack
        to={success ? '/help' : back.path}
        state={success ? undefined : back.state}
        label={success ? 'К помощи' : returnLocationLabel(back.path)}
      />
      <h1>{title}</h1>
      {form && (
        <p>
          <span className={styles.required}>*</span> — обязательное поле
        </p>
      )}
    </header>
  );
};
