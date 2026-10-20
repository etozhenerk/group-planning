import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { resetSession } from '@/entities/session/model/resetSession';

it('notifies an existing session observer and removes private cached content', () => {
  const client = new QueryClient();
  client.setQueryData(['session'], { user: { id: 'one' } });
  client.setQueryData(['private', 'one', 'meeting'], { text: 'secret' });
  const observer = new QueryObserver(client, { queryKey: ['session'], enabled: false });
  const unsubscribe = observer.subscribe(() => undefined);
  resetSession(client);
  expect(observer.getCurrentResult().data).toBeNull();
  expect(client.getQueryData(['private', 'one', 'meeting'])).toBeUndefined();
  unsubscribe();
});
