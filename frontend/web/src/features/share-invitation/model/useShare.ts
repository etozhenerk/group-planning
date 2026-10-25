import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInvitationLink } from '@/entities/meeting';

export const useShare = (id: string, visible = false) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const query = useQuery({
    queryKey: ['invitation-link', id],
    queryFn: ({ signal }) => getInvitationLink(id, signal),
    enabled: open || visible,
    retry: false,
    gcTime: 0,
  });

  const copy = async () => {
    if (!query.data) {
      return;
    }

    try {
      await navigator.clipboard.writeText(query.data);
      setMessage('Ссылка скопирована.');
      setFailed(false);
    } catch {
      setMessage('Не удалось скопировать. Выделите ссылку и скопируйте вручную.');
      setFailed(true);
    }
  };

  const share = async () => {
    if (!query.data) {
      return;
    }

    try {
      await navigator.share({ url: query.data });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setMessage('Не удалось открыть отправку. Скопируйте ссылку.');
        setFailed(true);
      }
    }
  };

  return {
    open,
    show: () => {
      setMessage('');
      setOpen(true);
    },
    close: () => setOpen(false),
    query,
    message,
    failed,
    copy,
    share,
    canShare: typeof navigator.share === 'function',
  };
};
