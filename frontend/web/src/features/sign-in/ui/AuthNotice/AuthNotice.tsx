import styles from '@/features/sign-in/ui/AuthNotice/AuthNotice.module.css';
import { useSearchParams } from 'react-router';
import { authNotice } from '@/features/sign-in/model/notice';

export const AuthNotice = () => {
  const [params] = useSearchParams();
  const text = authNotice(params.get('auth_error'));

  return text ? (
    <p className={styles['muted']} role="status">
      {text}
    </p>
  ) : null;
};
