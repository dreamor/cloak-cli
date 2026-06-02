import type { MethodCtx, MethodFn } from './index.js';
import { CloakError } from '../../errors.js';
import { getDefaultContext } from '../../browser.js';

export const pageMethods: Record<string, MethodFn> = {
  'page.new': async (params, ctx: MethodCtx) => {
    const sid = requireString(params, 'session_id');
    const rec = ctx.registry.requireSession(sid);
    const target = getOrMakeContext(rec.handle);
    const ctxObj = await target;
    const page = await ctxObj.newPage();
    const pageId = ctx.registry.registerPage(sid, page);
    return { page_id: pageId, url: page.url() };
  },

  'page.list': (params, ctx: MethodCtx) => {
    const sid = requireString(params, 'session_id');
    const desc = ctx.registry.describeSession(sid);
    return desc.pages;
  },

  'page.close': async (params, ctx: MethodCtx) => {
    const sid = requireString(params, 'session_id');
    const pid = requireString(params, 'page_id');
    const ref = ctx.registry.requirePage(sid, pid);
    await ref.page.close();
    return { closed: true };
  },

  'page.activate': (params, ctx: MethodCtx) => {
    const sid = requireString(params, 'session_id');
    const pid = requireString(params, 'page_id');
    ctx.registry.setActivePage(sid, pid);
    return { active_page: pid };
  },
};

async function getOrMakeContext(handle: import('../../browser.js').LaunchedHandle): Promise<import('../../browser.js').AnyContext> {
  return getDefaultContext(handle);
}

function requireString(params: Record<string, unknown>, key: string): string {
  const v = params[key];
  if (typeof v !== 'string' || !v) throw new CloakError('INVALID_ARG', `Missing required: ${key}`);
  return v;
}
