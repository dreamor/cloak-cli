import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

const HAS_BINARY = process.env.CLOAK_BINARY_READY === '1';

describe.skipIf(!HAS_BINARY)('one-shot fetch (requires CLOAK_BINARY_READY=1)', () => {
  it('fetches example.com and returns title', async () => {
    const { stdout } = await exec(process.execPath, ['bin/cloak.js', 'fetch', 'https://example.com', '--text']);
    const parsed = JSON.parse(stdout) as { ok: boolean; data: { title: string; text?: string } };
    expect(parsed.ok).toBe(true);
    expect(parsed.data.title).toMatch(/example/i);
    expect(parsed.data.text).toBeDefined();
  }, 90_000);
});

describe('fetch CLI structure', () => {
  it('rejects missing url', async () => {
    await expect(exec(process.execPath, ['bin/cloak.js', 'fetch'])).rejects.toThrow();
  });

  it('--help lists the command', async () => {
    const { stdout } = await exec(process.execPath, ['bin/cloak.js', 'fetch', '--help']);
    expect(stdout).toMatch(/--humanize/);
    expect(stdout).toMatch(/--proxy/);
    expect(stdout).toMatch(/--markdown/);
    expect(stdout).toMatch(/--screenshot/);
  });
});
