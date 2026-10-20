import { useMeeting } from '@/entities/meeting';
import { useDisclosure } from '@/shared/lib/disclosure';

export const useMeetingView = (id: string, user: string) => {
  const query = useMeeting(id, user);
  const details = useDisclosure();
  let invitation: string | null = null;

  try {
    invitation = sessionStorage.getItem(`somewhere-invitation:${user}:${id}`);
  } catch {
    /* The original URL can still be opened manually. */
  }

  return { query, details, invitation };
};
