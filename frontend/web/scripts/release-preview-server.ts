import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const fixtureRoot = process.env.SOMEWHERE_RELEASE_PREVIEW_ROOT;

if (!fixtureRoot) {
  throw new Error('SOMEWHERE_RELEASE_PREVIEW_ROOT is required');
}

const root = path.resolve(fixtureRoot);
const variants = new Set(['candidate', 'previous', 'long']);
const contentTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

let selected = 'candidate';

const respond = async (request: IncomingMessage, response: ServerResponse) => {
  try {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');

    if (url.pathname === '/__test/select' && request.method === 'POST') {
      const variant = url.searchParams.get('variant') ?? '';

      if (!variants.has(variant)) {
        response.writeHead(400).end();

        return;
      }

      await stat(path.join(root, variant, 'dist', 'index.html'));
      selected = variant;
      response.writeHead(204).end();

      return;
    }

    if (url.pathname.startsWith('/api/')) {
      response
        .writeHead(401, { 'Content-Type': 'application/json' })
        .end('{"error":"unauthorized"}');

      return;
    }

    const directory = path.join(root, selected, 'dist');
    const requested = path.resolve(directory, `.${decodeURIComponent(url.pathname)}`);

    if (requested !== directory && !requested.startsWith(`${directory}${path.sep}`)) {
      response.writeHead(400).end();

      return;
    }

    const file = path.extname(requested) ? requested : path.join(directory, 'index.html');
    const bytes = await readFile(file);
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(bytes);
  } catch {
    response.writeHead(404).end();
  }
};

const server = createServer((request, response) => {
  void respond(request, response);
});

server.listen(9328, '127.0.0.1');

const stop = () => {
  server.close();
};

process.on('SIGTERM', stop);
process.on('SIGINT', stop);
