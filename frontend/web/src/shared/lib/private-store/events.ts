import { z } from 'zod';

const schema = z.object({
  kind: z.enum(['changed', 'purged', 'accepted']),
  intent: z.string().optional(),
  user: z.string().optional(),
  meeting: z.string().optional(),
});

export type PrivateEvent = z.infer<typeof schema>;
const listeners = new Set<(event: PrivateEvent) => void>();
let channel: BroadcastChannel | undefined;
const generations = new Map<string, number>();
const receive = (event: PrivateEvent) => {
  if (event.kind === 'purged') {
    const key = event.user
      ? event.meeting
        ? `${event.user}:${event.meeting}`
        : event.user
      : 'global';

    generations.set(key, (generations.get(key) ?? 0) + 1);
  }

  for (const listener of listeners) {
    listener(event);
  }
};

const connect = () => {
  if (
    !channel &&
    typeof window !== 'undefined' &&
    typeof BroadcastChannel !== 'undefined'
  ) {
    channel = new BroadcastChannel('somewhere-private-chat');
    channel.onmessage = ({ data }) => {
      const parsed = schema.safeParse(data);

      if (parsed.success) {
        receive(parsed.data);
      }
    };
  }
};

export const privateGeneration = (user: string, meeting: string) =>
  ['global', user, `${user}:${meeting}`]
    .map((key) => generations.get(key) ?? 0)
    .join(':');

export const observePrivateStore = (listener: (event: PrivateEvent) => void) => {
  connect();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const publishPrivateStore = (event: PrivateEvent) => {
  connect();
  receive(event);
  channel?.postMessage(event);
};
