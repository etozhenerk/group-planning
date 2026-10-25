import { useEffect, useState } from 'react';
import type { Invitation } from '@/entities/meeting';

export const useJoinDeadline = (invitation: Invitation) => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = setInterval(refresh, 1000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  if (invitation.myRsvp === 'going') {
    return null;
  }

  if (invitation.joinDisabledReason === 'meeting_past') {
    return 'Встреча уже прошла. Присоединиться нельзя.';
  }

  if (
    invitation.canJoin === false ||
    (invitation.joinClosesAt && now >= Date.parse(invitation.joinClosesAt))
  ) {
    return 'Участие закрыто за час до начала встречи.';
  }

  return null;
};
