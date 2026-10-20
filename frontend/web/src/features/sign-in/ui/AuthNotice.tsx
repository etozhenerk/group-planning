import { useSearchParams } from 'react-router';
import { authNotice } from '@/features/sign-in/model/notice';

export const AuthNotice = () => {
  const [params] = useSearchParams();
  const text = authNotice(params.get('auth_error'));

  return text ? (
    <p className="muted" role="status">
      {text}
    </p>
  ) : null;
};
