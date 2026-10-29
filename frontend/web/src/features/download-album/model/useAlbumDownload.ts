import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { accessEpoch, denyAccess, useAccess } from '@/entities/meeting';
import { resetSession } from '@/entities/session';
import type { Session } from '@/entities/session';
import { createAlbumDownload } from '@/features/download-album/model/createAlbumDownload';
import type { AlbumDownloadState } from '@/features/download-album/model/types';

const idle: AlbumDownloadState = { phase: 'idle' };

export const useAlbumDownload = (meeting: string, session: Session) => {
  const client = useQueryClient();
  const user = session.user.id;
  const { csrf, expiresAt } = session;
  const access = useAccess(user, meeting);
  const identity = useMemo(
    () => ({
      user,
      meeting,
      csrf,
      expiresAt,
      epoch: access.epoch,
      denied: access.denied,
    }),
    [user, meeting, csrf, expiresAt, access.epoch, access.denied],
  );

  const [snapshot, setSnapshot] = useState<{
    identity: typeof identity;
    value: AlbumDownloadState;
  }>();

  const active = useRef<{
    identity: typeof identity;
    controller: ReturnType<typeof createAlbumDownload>;
  } | null>(null);

  useLayoutEffect(() => {
    if (identity.denied) {
      return;
    }

    const lease = new AbortController();
    const controller = createAlbumDownload(
      {
        user: identity.user,
        meeting: identity.meeting,
        csrf: identity.csrf,
        signal: lease.signal,
        current: () => {
          const current = client.getQueryData<Session | null>(['session']);

          return (
            accessEpoch(identity.user, identity.meeting) === identity.epoch &&
            current?.user.id === identity.user &&
            current.csrf === identity.csrf &&
            current.expiresAt === identity.expiresAt
          );
        },
      },
      {
        denied: (cause) => {
          if (cause.status === 401) {
            resetSession(client);
          } else {
            denyAccess(client, identity.user, identity.meeting, identity.epoch);
          }
        },
      },
    );

    const entry = { identity, controller };
    active.current = entry;
    const unsubscribe = controller.subscribe(() => {
      setSnapshot({ identity, value: controller.getSnapshot() });
    });

    return () => {
      unsubscribe();
      lease.abort();

      if (active.current === entry) {
        active.current = null;
      }
    };
  }, [client, identity]);

  return {
    state: snapshot?.identity === identity ? snapshot.value : idle,
    start: () => {
      if (active.current?.identity === identity) {
        void active.current.controller.start();
      }
    },
    cancel: () => {
      if (active.current?.identity === identity) {
        active.current.controller.cancel();
      }
    },
  };
};
