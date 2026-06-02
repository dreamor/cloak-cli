import { Command } from 'commander';
import { getClient } from '../client.js';
import { ok, fail, type GlobalFlags } from '../output.js';
import { attachLaunchOptions, pickLaunchOpts } from '../options.js';

export function buildSessionCmd(globalFlags: () => GlobalFlags): Command {
  const cmd = new Command('session').description('Manage browser sessions');

  const newCmd = new Command('new').description('Create a new session, returns session_id and initial page_id');
  attachLaunchOptions(newCmd);
  newCmd
    .option('--ttl-ms <ms>', 'Idle TTL in ms (default 1h)')
    .action(async (opts: Record<string, unknown>) => {
      const flags = globalFlags();
      try {
        const launchOpts = pickLaunchOpts(opts);
        const params: Record<string, unknown> = { opts: launchOpts };
        if (opts.ttlMs) params.ttl_ms = Number(opts.ttlMs);
        const data = (await getClient().call('session.new', params)) as { session_id: string; page_id: string };
        ok(data, flags, { session_id: data.session_id, page_id: data.page_id });
      } catch (err) {
        fail(err, flags);
      }
    });
  cmd.addCommand(newCmd);

  cmd.command('list')
    .description('List all active sessions')
    .action(async () => {
      const flags = globalFlags();
      try {
        const data = await getClient().call('session.list');
        ok(data, flags);
      } catch (err) {
        fail(err, flags);
      }
    });

  cmd.command('info <session_id>')
    .description('Show session details (pages, ttl, meta)')
    .action(async (sid: string) => {
      const flags = globalFlags();
      try {
        const data = await getClient().call('session.info', { session_id: sid });
        ok(data, flags, { session_id: sid });
      } catch (err) {
        fail(err, flags);
      }
    });

  cmd.command('close <session_id>')
    .description('Close a session and free its browser')
    .action(async (sid: string) => {
      const flags = globalFlags();
      try {
        const data = await getClient().call('session.close', { session_id: sid });
        ok(data, flags, { session_id: sid });
      } catch (err) {
        fail(err, flags);
      }
    });

  cmd.command('save-state <session_id> <path>')
    .description('Save storageState (cookies + localStorage) to a JSON file')
    .action(async (sid: string, path: string) => {
      const flags = globalFlags();
      try {
        const data = await getClient().call('session.save_state', { session_id: sid, path });
        ok(data, flags, { session_id: sid });
      } catch (err) {
        fail(err, flags);
      }
    });

  return cmd;
}
