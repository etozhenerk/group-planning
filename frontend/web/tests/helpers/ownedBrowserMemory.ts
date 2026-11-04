import { spawn } from 'node:child_process';

// Process RSS sums include shared pages; they are not JS live heap or physical footprint.
// Read only numeric process metadata and retain descendants of this QA worker.
export const ownedBrowserMemory = async () =>
  new Promise<{ rssKiB: number; pids: number[] }>((resolve, reject) => {
    const probe = spawn('ps', ['-A', '-o', 'pid=,ppid=,rss=']);
    let output = '';
    probe.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    probe.once('error', reject);
    probe.once('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Numeric process probe exited ${String(code)}`));

        return;
      }

      const rows = output
        .trim()
        .split('\n')
        .map((line) => {
          const [pid = 0, parent = 0, rss = 0] = line.trim().split(/\s+/).map(Number);

          return { pid, parent, rss };
        });

      const owned = new Set([process.pid]);

      for (let pass = 0; pass < rows.length; pass += 1) {
        const before = owned.size;

        for (const row of rows) {
          if (owned.has(row.parent) && row.pid !== probe.pid) {
            owned.add(row.pid);
          }
        }

        if (owned.size === before) {
          break;
        }
      }

      const browser = rows.filter((row) => row.pid !== process.pid && owned.has(row.pid));
      resolve({
        rssKiB: browser.reduce((total, row) => total + row.rss, 0),
        pids: browser.map((row) => row.pid),
      });
    });
  });
