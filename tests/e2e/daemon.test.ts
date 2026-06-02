import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnDetached, stopDaemon, status } from '../../src/daemon/lifecycle.js';
import { getClient } from '../../src/client.js';

describe('daemon e2e (RPC plumbing)', () => {
  beforeAll(async () => {
    // Ensure clean slate
    if (status().running) await stopDaemon();
    await spawnDetached();
  }, 30_000);

  afterAll(async () => {
    try { getClient().close(); } catch { /* */ }
    await stopDaemon();
  });

  it('responds to daemon.ping', async () => {
    const data = (await getClient().call<{ pong: boolean; ts: number }>('daemon.ping')) as { pong: boolean; ts: number };
    expect(data.pong).toBe(true);
    expect(typeof data.ts).toBe('number');
  });

  it('reports daemon.status', async () => {
    const data = (await getClient().call('daemon.status')) as { pid: number; uptime_ms: number; sessions: number };
    expect(data.pid).toBe(status().pid);
    expect(data.sessions).toBe(0);
    expect(data.uptime_ms).toBeGreaterThanOrEqual(0);
  });

  it('lists ≥60 RPC methods', async () => {
    const methods = (await getClient().call('daemon.methods')) as string[];
    expect(methods.length).toBeGreaterThanOrEqual(60);
    expect(methods).toContain('session.new');
    expect(methods).toContain('page.goto');
    expect(methods).toContain('page.click');
    expect(methods).toContain('page.eval');
    expect(methods).toContain('cookies.get');
    expect(methods).toContain('page.snapshot');
  });

  it('returns structured error for unknown method', async () => {
    await expect(getClient().call('nonexistent.method')).rejects.toMatchObject({ code: 'NOT_IMPLEMENTED' });
  });

  it('returns structured error for missing required param', async () => {
    await expect(getClient().call('session.info', {})).rejects.toMatchObject({ code: 'INVALID_ARG' });
  });
});
