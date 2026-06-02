import type { MethodCtx, MethodFn } from './index.js';
import { CloakError } from '../../errors.js';

const optStr = (p: Record<string, unknown>, k: string): string | undefined =>
  typeof p[k] === 'string' && p[k] ? (p[k] as string) : undefined;
const reqStr = (p: Record<string, unknown>, k: string): string => {
  const v = p[k];
  if (typeof v !== 'string' || !v) throw new CloakError('INVALID_ARG', `Missing required: ${k}`);
  return v;
};

/**
 * Install a one-shot dialog handler on a page. The next dialog will be
 * automatically accepted or dismissed. Useful for `window.alert/confirm/prompt`
 * pages that block navigation.
 */
export const dialogMethods: Record<string, MethodFn> = {
  'dialog.handle_next': async (params, ctx: MethodCtx) => {
    const sid = reqStr(params, 'session_id');
    const action = reqStr(params, 'action');
    if (action !== 'accept' && action !== 'dismiss') {
      throw new CloakError('INVALID_ARG', 'action must be "accept" or "dismiss"');
    }
    const text = optStr(params, 'text');
    const ref = ctx.registry.requirePage(sid, optStr(params, 'page_id'));
    return await new Promise<{ handled: true; action: string; type: string; message: string }>((resolve) => {
      const handler = (...args: unknown[]): void => {
        const dialog = args[0] as {
          type: () => string;
          message: () => string;
          accept: (t?: string) => Promise<void>;
          dismiss: () => Promise<void>;
        };
        ref.page.off?.('dialog', handler);
        const type = dialog.type();
        const message = dialog.message();
        const p = action === 'accept' ? dialog.accept(text ?? '') : dialog.dismiss();
        p.finally(() => resolve({ handled: true, action, type, message }));
      };
      ref.page.on('dialog', handler);
    });
  },
};
