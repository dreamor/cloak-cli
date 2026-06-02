import type { Registry } from '../registry.js';
import { CloakError } from '../../errors.js';
import { sessionMethods } from './session.js';
import { pageMethods } from './page.js';
import { navigationMethods } from './navigation.js';
import { contentMethods } from './content.js';
import { interactionMethods } from './interaction.js';
import { evalMethods } from './eval.js';
import { cookiesMethods } from './cookies.js';
import { storageMethods } from './storage.js';
import { waitMethods } from './wait.js';
import { snapshotMethods } from './snapshot.js';
import { networkMethods } from './network.js';
import { dialogMethods } from './dialog.js';
import { daemonMethods } from './daemon.js';

export type MethodCtx = {
  registry: Registry;
  startedAt: number;
};

export type MethodFn = (params: Record<string, unknown>, ctx: MethodCtx) => Promise<unknown> | unknown;

const registry: Record<string, MethodFn> = {
  ...daemonMethods,
  ...sessionMethods,
  ...pageMethods,
  ...navigationMethods,
  ...contentMethods,
  ...interactionMethods,
  ...evalMethods,
  ...cookiesMethods,
  ...storageMethods,
  ...waitMethods,
  ...snapshotMethods,
  ...networkMethods,
  ...dialogMethods,
};

export async function dispatch(
  method: string,
  params: Record<string, unknown>,
  reg: Registry,
  meta: { startedAt: number }
): Promise<unknown> {
  const fn = registry[method];
  if (!fn) throw new CloakError('NOT_IMPLEMENTED', `Unknown method: ${method}`);
  return fn(params, { registry: reg, startedAt: meta.startedAt });
}

export function listMethods(): string[] {
  return Object.keys(registry).sort();
}
