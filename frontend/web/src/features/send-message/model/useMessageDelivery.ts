import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { privateKey, useAccess } from '@/entities/meeting';
import { changeOutgoing } from '@/features/send-message/model/changeOutgoing';
import { outgoingError } from '@/features/send-message/lib/outgoingError';

export const useMessageDelivery = (user: string, meeting: string, id: string) => {
  const access = useAccess(user, meeting);
  const occupied = useQuery<boolean>({
    queryKey: privateKey(user, meeting, access.epoch, 'draft-occupied'),
    enabled: false,
    initialData: false,
  });

  const [error, setError] = useState<string | null>(null);
  const perform = async (action: 'retry' | 'restore') => {
    setError(null);

    try {
      await changeOutgoing(user, meeting, id, action);

      return true;
    } catch (failure) {
      setError(outgoingError(failure));

      return false;
    }
  };

  return { occupied: occupied.data, error, perform };
};
