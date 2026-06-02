import { CloakError } from '../errors.js';

export function parseViewport(value: string | undefined): { width: number; height: number } | undefined {
  if (!value) return undefined;
  const m = /^(\d+)x(\d+)$/i.exec(value.trim());
  if (!m) {
    throw new CloakError('INVALID_ARG', `Invalid viewport "${value}", expected WxH (e.g. 1920x1080)`);
  }
  return { width: Number(m[1]), height: Number(m[2]) };
}

export function parseJsonArg<T = unknown>(value: string | undefined, name: string): T | undefined {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch (err) {
    throw new CloakError('INVALID_JSON', `Invalid JSON for --${name}: ${(err as Error).message}`);
  }
}

export function parseInteger(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new CloakError('INVALID_ARG', `Invalid integer for --${name}: ${value}`);
  }
  return n;
}

export function parseBoolean(value: string | boolean | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  const v = value.toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(v)) return true;
  if (['false', '0', 'no', 'off'].includes(v)) return false;
  throw new CloakError('INVALID_ARG', `Invalid boolean: ${value}`);
}
