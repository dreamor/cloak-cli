import { Command } from 'commander';
import { getClient } from '../client.js';
import { ok, fail, type GlobalFlags } from '../output.js';

type GF = () => GlobalFlags;

function emit(method: string, params: Record<string, unknown>, sid: string, flags: GlobalFlags): Promise<void> {
  return getClient().call(method, params).then(
    (data) => ok(data, flags, { session_id: sid }),
    (err) => fail(err, flags)
  );
}

export function buildEvalCmd(g: GF): Command {
  return new Command('eval').description('Evaluate JS in the page').argument('<session_id>').argument('<expression>')
    .option('--page <id>')
    .option('--arg <json>', 'Argument passed to the function as JSON')
    .action(async (sid: string, expr: string, opts: Record<string, unknown>) => {
      const flags = g();
      const params: Record<string, unknown> = { session_id: sid, expression: expr };
      if (opts.page) params.page_id = opts.page;
      if (opts.arg) {
        try { params.arg = JSON.parse(opts.arg as string); }
        catch (err) { fail(err, flags); }
      }
      await emit('page.eval', params, sid, flags);
    });
}

export function buildEvalFileCmd(g: GF): Command {
  return new Command('eval-file').description('Evaluate JS from a file in the page').argument('<session_id>').argument('<path>')
    .option('--page <id>')
    .option('--arg <json>')
    .action(async (sid: string, path: string, opts: Record<string, unknown>) => {
      const flags = g();
      const params: Record<string, unknown> = { session_id: sid, path };
      if (opts.page) params.page_id = opts.page;
      if (opts.arg) {
        try { params.arg = JSON.parse(opts.arg as string); }
        catch (err) { fail(err, flags); }
      }
      await emit('page.eval_file', params, sid, flags);
    });
}
