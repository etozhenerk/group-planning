import { useLayoutEffect, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/entities/session';

export const useDocumentPosition = (kind: string) => {
  const client = useQueryClient(),
    session = useSession(),
    body = useRef<HTMLDivElement>(null);

  const owner = session.data?.user.id ?? 'anonymous';
  useEffect(() => {
    client.setQueryDefaults(['service-reading'], { gcTime: Infinity });
  }, [client]);
  useLayoutEffect(() => {
    const el = body.current,
      key = ['service-reading', owner, kind];

    if (el) {
      el.scrollTop = client.getQueryData<number>(key) ?? 0;
    }

    const record = () => {
      if (el) {
        client.setQueryData(key, el.scrollTop);
      }
    };

    el?.addEventListener('scroll', record, { passive: true });

    // The same DOM scroller is reused for both documents; its height may clamp
    // scrollTop before layout cleanup, so save live scroll events instead.
    return () => el?.removeEventListener('scroll', record);
  }, [client, owner, kind]);

  return body;
};
