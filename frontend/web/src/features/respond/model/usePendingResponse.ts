import { useContext } from 'react';
import { responseContext } from '@/features/respond/model/responseContext';

export const usePendingResponse = (id: string, user: string) => {
  const request = useContext(responseContext)?.request;

  return request?.id === id && request.session.user.id === user ? request : null;
};
