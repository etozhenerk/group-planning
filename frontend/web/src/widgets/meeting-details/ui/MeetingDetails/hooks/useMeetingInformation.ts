import { useLayoutEffect } from 'react';
import { useMeeting } from '@/entities/meeting';

export const useMeetingInformation = (id: string, user: string, active: boolean) => {
  const query = useMeeting(id, user, false);
  const { refetch } = query;

  useLayoutEffect(() => {
    if (active) {
      void refetch();
    }
  }, [active, refetch]);

  return query;
};
