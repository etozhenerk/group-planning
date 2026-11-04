import type { QueryClient } from '@tanstack/react-query';
import { loadWindowPage } from '@/entities/meeting/model/loadWindowPage';

export const loadOlderConversation = (
  client: QueryClient,
  user: string,
  id: string,
  epoch: number,
  signal?: AbortSignal,
) => loadWindowPage(client, user, id, epoch, 'older', signal);
