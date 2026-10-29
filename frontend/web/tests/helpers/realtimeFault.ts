import type { Page, WebSocketRoute } from '@playwright/test';

type Connection = {
  client: WebSocketRoute;
  server?: WebSocketRoute;
  subscribed: boolean;
};

export const realtimeFault = async (page: Page) => {
  const connections: Connection[] = [];
  let barrier = Promise.resolve();
  const gate: { release?: () => void } = {};
  await page.routeWebSocket('**/api/v1/realtime', async (client) => {
    const connection: Connection = { client, subscribed: false };
    connections.push(connection);
    await barrier;
    const server = client.connectToServer();
    connection.server = server;
    server.onMessage((message) => {
      for (const line of String(message).split('\n')) {
        if (!line) {
          continue;
        }

        const reply: unknown = JSON.parse(line);

        if (typeof reply === 'object' && reply !== null && 'subscribe' in reply) {
          connection.subscribed = true;
        }
      }

      client.send(message);
    });
  });

  const hold = () => {
    barrier = new Promise<void>((resolve) => {
      gate.release = resolve;
    });
  };

  const resume = () => {
    gate.release?.();
    delete gate.release;
    barrier = Promise.resolve();
  };

  const disconnect = async (connection: Connection) => {
    if (!connection.server) {
      throw new Error('A connected transport is required before injecting a fault');
    }

    await Promise.all([
      connection.client.close({ code: 1013, reason: 'Controlled transport failure' }),
      connection.server.close(),
    ]);
  };

  return { connections, hold, resume, disconnect };
};
