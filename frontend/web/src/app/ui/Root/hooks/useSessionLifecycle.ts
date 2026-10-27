import { observePrivateStore } from '@/shared/lib/private-store';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSession, resetSession } from '@/entities/session';
import { resetAccess } from '@/entities/meeting';
import { onUnauthorized } from '@/shared/api';

export const useSessionLifecycle = () => {
  const client = useQueryClient();
  const session = useSession();
  const location = useLocation();
  const visited = useRef(false);
  useEffect(
    () =>
      observePrivateStore((event) => {
        if (event.kind === 'purged' && !event.meeting) {
          resetSession(client, false);
          resetAccess();
        }
      }),
    [client],
  );
  useEffect(
    () =>
      onUnauthorized(() => {
        resetSession(client);
        resetAccess();
      }),
    [client],
  );
  useEffect(() => {
    if (!session.data) {
      return;
    }

    try {
      sessionStorage.setItem('somewhere-active-user', session.data.user.id);
    } catch {
      /* Session state remains in memory. */
    }

    const remaining = Date.parse(session.data.expiresAt) - Date.now();
    const expiry = Date.parse(session.data.expiresAt);
    const timer = window.setTimeout(
      () => {
        if (Date.now() < expiry) {
          void client.invalidateQueries({ queryKey: ['session'] });

          return;
        }

        resetSession(client);
        resetAccess();
      },
      Math.max(0, Math.min(remaining, 2_147_483_647)),
    );

    return () => window.clearTimeout(timer);
  }, [client, session.data]);
  useEffect(() => {
    if (!visited.current) {
      visited.current = true;

      return;
    }

    const main = document.getElementById('main');

    if (main) {
      main.tabIndex = -1;
      main.focus({ preventScroll: true });
    }

    window.scrollTo(0, 0);
  }, [location.pathname]);
};
