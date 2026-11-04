import { Centrifuge } from 'centrifuge';
import { z } from 'zod';

const hintSchema = z.object({
  schema_version: z.literal(1),
  meeting_id: z.string(),
  stream_epoch: z.string(),
  latest_change_sequence: z.string().regex(/^(0|[1-9][0-9]*)$/),
});

export type RealtimeOptions = {
  url: string;
  meeting?: string;
  authenticate: () => Promise<void>;
  ready: () => void;
  hint: () => void;
  personal: () => void;
  unavailable: () => void;
  denied: () => void;
};

export const createRealtime = (options: RealtimeOptions) => {
  let stopped = false;
  const connection = new Centrifuge(options.url, {
    debug: false,
    name: 'somewhere-web',
    minReconnectDelay: 1_000,
    maxReconnectDelay: 30_000,
    networkEventTarget: new EventTarget(),
    pageEventTarget: new EventTarget(),
    getData: async () => {
      await options.authenticate();

      if (stopped) {
        throw new DOMException('Stopped realtime', 'AbortError');
      }

      return undefined;
    },
  });

  const active = (callback: () => void) => {
    if (!stopped) {
      callback();
    }
  };

  const subscription = options.meeting
    ? connection.newSubscription(`meeting:${options.meeting}`)
    : undefined;

  subscription?.on('subscribed', () => active(options.ready));
  subscription?.on('subscribing', () => active(options.unavailable));
  subscription?.on('unsubscribed', ({ code }) =>
    active(code === 2003 ? options.denied : options.unavailable),
  );
  subscription?.on('publication', ({ data }) => {
    const hint = hintSchema.safeParse(data);

    if (hint.success && hint.data.meeting_id === options.meeting) {
      active(options.hint);
    }
  });
  subscription?.on('error', ({ error }) => {
    active(error.code === 103 ? options.denied : options.unavailable);
  });
  connection.on('connected', () => {
    if (!subscription) {
      active(options.ready);
    }
  });
  connection.on('connecting', () => active(options.unavailable));
  connection.on('error', () => active(options.unavailable));
  connection.on('disconnected', ({ code }) => {
    if (code >= 3500 && !stopped) {
      void options.authenticate().then(
        () => active(options.denied),
        () => active(options.denied),
      );
    } else {
      active(options.unavailable);
    }
  });
  connection.on('publication', ({ channel }) => {
    if (channel.startsWith('personal:')) {
      active(options.personal);
    }
  });
  subscription?.subscribe();
  connection.connect();

  return () => {
    stopped = true;
    subscription?.unsubscribe();
    connection.disconnect();
    connection.removeAllListeners();
    subscription?.removeAllListeners();
  };
};
