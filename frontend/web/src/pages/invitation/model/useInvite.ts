import { useEffect } from 'react';
import { useInvitation } from '@/entities/meeting';

export const useInvite = (token: string, user: string) => {
  const query = useInvitation(token, user);
  useEffect(() => {
    if (query.data && user) {
      try {
        sessionStorage.setItem(
          `somewhere-invitation:${user}:${query.data.meetingId}`,
          token,
        );
      } catch {
        /* Invitation remains open in the current URL. */
      }
    }
  }, [query.data, user, token]);

  return query;
};
