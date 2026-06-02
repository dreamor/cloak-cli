import { Command } from 'commander';
import { getClient } from '../client.js';
import { ok, fail, type GlobalFlags } from '../output.js';

export function buildPageCmd(globalFlags: () => GlobalFlags): Command {
  const cmd = new Command('page').description('Manage pages within a session');

  cmd.command('new <session_id>')
    .description('Open a new page in the session')
    .action(async (sid: string) => {
      const flags = globalFlags();
      try {
        const data = (await getClient().call('page.new', { session_id: sid })) as { page_id: string; url: string };
        ok(data, flags, { session_id: sid, page_id: data.page_id });
      } catch (err) { fail(err, flags); }
    });

  cmd.command('list <session_id>')
    .description('List pages in the session')
    .action(async (sid: string) => {
      const flags = globalFlags();
      try {
        const data = await getClient().call('page.list', { session_id: sid });
        ok(data, flags, { session_id: sid });
      } catch (err) { fail(err, flags); }
    });

  cmd.command('close <session_id> <page_id>')
    .description('Close a specific page')
    .action(async (sid: string, pid: string) => {
      const flags = globalFlags();
      try {
        const data = await getClient().call('page.close', { session_id: sid, page_id: pid });
        ok(data, flags, { session_id: sid, page_id: pid });
      } catch (err) { fail(err, flags); }
    });

  cmd.command('activate <session_id> <page_id>')
    .description('Make a page the default for the session')
    .action(async (sid: string, pid: string) => {
      const flags = globalFlags();
      try {
        const data = await getClient().call('page.activate', { session_id: sid, page_id: pid });
        ok(data, flags, { session_id: sid, page_id: pid });
      } catch (err) { fail(err, flags); }
    });

  return cmd;
}
