import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { getSession } from '@/entities/session';

export const useAuthReturn = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [failed, setFailed] = useState(false);
  const token = params.get('token');
  const invited =
    params.get('kind') === 'invitation' && token && /^[A-Za-z0-9_-]{43}$/.test(token);

  const target = invited ? `/invitations/${token}` : '/meetings';
  const error = params.get('auth_error');
  useEffect(() => {
    const controller = new AbortController();

    if (error) {
      void navigate(
        `${target}?auth_error=${error === 'auth_cancelled' ? 'cancelled' : 'unavailable'}`,
        { replace: true },
      );

      return;
    }

    void getSession(controller.signal)
      .then((session) => {
        if (!controller.signal.aborted) {
          client.setQueryData(['session'], session);

          if (session) {
            void navigate(target, { replace: true });
          } else {
            setFailed(true);
          }
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFailed(true);
        }
      });

    return () => controller.abort();
  }, [client, error, navigate, target]);

  return { failed, target };
};
