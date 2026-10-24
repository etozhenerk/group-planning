import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { endSession, resetSession } from '@/entities/session';
import type { Session } from '@/entities/session';
import { resetAccess } from '@/entities/meeting';

export const useLogout = (session: Session) => {
  const client = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: () => endSession(session.csrf),
    onSuccess: async () => {
      resetSession(client);
      resetAccess();

      try {
        for (const key of Object.keys(sessionStorage)) {
          if (key.startsWith('somewhere-')) {
            sessionStorage.removeItem(key);
          }
        }
      } catch {
        // The server session and in-memory cache have already been cleared.
      }

      await navigate('/', { replace: true });
    },
    retry: false,
  });
};
