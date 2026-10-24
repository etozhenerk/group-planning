import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useSession } from '@/entities/session';
import type { ReturnContext } from '@/features/sign-in';

export const useAuthReturn = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const session = useSession({ refreshOnMount: true });
  const token = params.get('token');
  const invited =
    params.get('kind') === 'invitation' &&
    token &&
    /^([A-Za-z0-9_-]{22}|[A-Za-z0-9_-]{43})$/.test(token);

  const target = invited ? `/i/${token}` : '/meetings';
  const context: ReturnContext = invited
    ? { kind: 'invitation', token }
    : { kind: 'home' };

  const error = params.get('auth_error');
  useEffect(() => {
    if (error) {
      void navigate(
        `${target}?auth_error=${error === 'auth_cancelled' ? 'cancelled' : 'unavailable'}`,
        { replace: true },
      );

      return;
    }

    if (!session.isFetching && session.isSuccess && session.data) {
      void navigate(target, { replace: true });
    }
  }, [error, navigate, session.data, session.isFetching, session.isSuccess, target]);

  const failure =
    error || session.isFetching || session.isPending
      ? null
      : session.isError
        ? 'network'
        : !session.data
          ? 'session'
          : null;

  return {
    failure,
    context,
    backTarget: invited ? target : '/',
    backLabel: invited ? 'К приглашению' : 'На главную',
    retry: () => void session.refetch(),
  };
};
