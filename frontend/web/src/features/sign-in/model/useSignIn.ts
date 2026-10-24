import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { request, startedSchema, writeOptions } from '@/shared/api';
import { isDemo } from '@/shared/config';

export type ReturnContext = { kind: 'home' } | { kind: 'invitation'; token: string };

export const useSignIn = (context: ReturnContext) => {
  const action = useMutation({
    mutationFn: async () => {
      const result = await request(startedSchema, '/auth/yandex/start', {
        ...writeOptions('POST', null, { client_kind: 'web', return_context: context }),
        signal: AbortSignal.timeout(15_000),
      });

      const address = new URL(result.authorization_url);

      if (
        address.protocol !== 'https:' ||
        (address.origin !== 'https://oauth.yandex.ru' &&
          !(isDemo && address.origin === window.location.origin))
      ) {
        throw new Error('Unexpected authorization origin');
      }

      window.location.assign(address.href);
    },
    retry: false,
  });

  const { reset } = action;
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) {
        reset();
      }
    };

    window.addEventListener('pageshow', restore);

    return () => window.removeEventListener('pageshow', restore);
  }, [reset]);

  return { ...action, isBusy: action.isPending || action.isSuccess };
};
