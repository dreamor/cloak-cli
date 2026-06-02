import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { paths } from '../utils/paths.js';
import { readPid, isAlive } from './server.js';
import { CloakError } from '../errors.js';

export type DaemonStatus = {
  running: boolean;
  pid?: number;
  socket: string;
};

export function status(): DaemonStatus {
  const pid = readPid();
  if (pid && isAlive(pid) && existsSync(paths.sock)) {
    return { running: true, pid, socket: paths.sock };
  }
  return { running: false, socket: paths.sock };
}

/**
 * Locate the daemon entry script. When running from compiled dist, the entry
 * sits next to this file (entry.js). When running from TS source (tests/dev),
 * walk up to find dist/daemon/entry.js — building once with `tsc` is required.
 */
function findDaemonEntry(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const sibling = resolve(here, 'entry.js');
  if (existsSync(sibling)) return sibling;

  let dir = here;
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, 'dist', 'daemon', 'entry.js');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new CloakError(
    'BOOT_ERROR',
    'Cannot find daemon entry. Run `npm run build` first or install the package.'
  );
}

/**
 * Spawn the daemon as a detached background process.
 * Resolves once the socket appears or rejects on timeout.
 */
export async function spawnDetached(options: { logPath?: string } = {}): Promise<DaemonStatus> {
  if (status().running) {
    throw new CloakError('DAEMON_ALREADY_RUNNING', 'Daemon already running');
  }

  const entry = findDaemonEntry();
  const child = spawn(process.execPath, [entry], {
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      CLOAK_DAEMON: '1',
      ...(options.logPath ? { CLOAK_DAEMON_LOG: options.logPath } : {}),
    },
  });
  child.unref();

  // Poll for socket
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const s = status();
    if (s.running) return s;
    await sleep(100);
  }
  throw new CloakError('DAEMON_TIMEOUT', 'Daemon did not come up within 10s');
}

export async function stopDaemon(): Promise<boolean> {
  const s = status();
  if (!s.running || !s.pid) return false;
  try {
    process.kill(s.pid, 'SIGTERM');
  } catch {
    return false;
  }
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (!status().running) return true;
    await sleep(100);
  }
  // Force kill
  try {
    if (s.pid) process.kill(s.pid, 'SIGKILL');
  } catch {
    // ignore
  }
  return !status().running;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
