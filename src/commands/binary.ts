import { spawn } from 'node:child_process';
import { Command } from 'commander';
import { ok, fail, type GlobalFlags } from '../output.js';
import { loadCloakBrowser } from '../browser.js';

type GF = () => GlobalFlags;

/**
 * Binary subcommand: thin shim around cloakbrowser's JS API
 * (ensureBinary, binaryInfo, clearCache). The cloakbrowser package
 * also exposes a Python `python -m cloakbrowser` CLI; this command
 * uses the JS surface so it works on Node-only installs.
 */
export function buildBinaryCmd(g: GF): Command {
  const cmd = new Command('binary').description('Manage the stealth Chromium binary');

  cmd.command('install')
    .description('Pre-download the stealth Chromium binary')
    .action(async () => {
      const flags = g();
      try {
        const cb = await loadCloakBrowser();
        if (!cb.ensureBinary) {
          fail(new Error('cloakbrowser.ensureBinary not available — upgrade cloakbrowser'), flags);
          return;
        }
        const path = await cb.ensureBinary();
        ok({ installed: true, path }, flags);
      } catch (err) { fail(err, flags); }
    });

  cmd.command('info')
    .description('Show binary info (version, path, platform)')
    .action(async () => {
      const flags = g();
      try {
        const cb = await loadCloakBrowser();
        const info = cb.binaryInfo ? cb.binaryInfo() : { unavailable: true };
        ok(info, flags);
      } catch (err) { fail(err, flags); }
    });

  cmd.command('update')
    .description('Check for and download newer binary (ensureBinary)')
    .action(async () => {
      const flags = g();
      try {
        const cb = await loadCloakBrowser();
        if (!cb.ensureBinary) {
          fail(new Error('cloakbrowser.ensureBinary not available'), flags);
          return;
        }
        const path = await cb.ensureBinary();
        ok({ updated: true, path }, flags);
      } catch (err) { fail(err, flags); }
    });

  cmd.command('clear-cache')
    .description('Remove cached binaries')
    .action(async () => {
      const flags = g();
      try {
        const cb = await loadCloakBrowser();
        if (!cb.clearCache) {
          fail(new Error('cloakbrowser.clearCache not available'), flags);
          return;
        }
        cb.clearCache();
        ok({ cleared: true }, flags);
      } catch (err) { fail(err, flags); }
    });

  return cmd;
}

/**
 * `cloak serve` — spawn cloakserve via Python module (cloakbrowser's official CDP server).
 * Requires Python install of cloakbrowser. For pure-Node use cases, agents can still use
 * `cloak session new` + `cloak goto ...`.
 */
export function buildServeCmd(g: GF): Command {
  return new Command('serve').description('Run the CloakBrowser CDP server (cloakserve) — requires Python install')
    .option('--port <port>', 'CDP port', '9222')
    .option('--host <host>', 'CDP host', '127.0.0.1')
    .option('--headless <bool>', 'true|false')
    .option('--proxy-server <url>')
    .action(async (opts: Record<string, unknown>) => {
      const flags = g();
      const args: string[] = ['-m', 'cloakbrowser.cloakserve'];
      if (opts.port) args.push(`--port=${opts.port}`);
      if (opts.host) args.push(`--host=${opts.host}`);
      if (opts.headless) args.push(`--headless=${opts.headless}`);
      if (opts.proxyServer) args.push(`--proxy-server=${opts.proxyServer}`);

      const py = process.env.PYTHON ?? 'python3';
      const child = spawn(py, args, { stdio: 'inherit' });
      child.on('error', (err) => fail(err, flags));
      child.on('exit', (code) => {
        if (code === 0) ok({ exited: 0 }, flags);
        else process.exit(code ?? 1);
      });
    });
}

export function buildConnectCmd(g: GF): Command {
  return new Command('connect').description('Create a session that attaches to an existing CDP endpoint')
    .argument('<ws_url>', 'CDP WebSocket URL (ws:// or http://)')
    .action(async (wsUrl: string) => {
      const flags = g();
      try {
        const { getClient } = await import('../client.js');
        const data = await getClient().call('session.new', {
          opts: { extraArgs: JSON.stringify([`--remote-debugging-url=${wsUrl}`]) },
        });
        ok(data, flags);
      } catch (err) { fail(err, flags); }
    });
}
