import { describe, expect, it } from 'vitest';
import { nextId, makeOk, makeError } from '../../src/daemon/protocol.js';
import { CloakError } from '../../src/errors.js';

describe('protocol', () => {
  it('generates unique ids', () => {
    const a = nextId();
    const b = nextId();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^\d+-[a-z0-9]+-[a-z0-9]+$/);
  });

  it('makeOk produces success envelope', () => {
    const env = makeOk('id-1', { x: 1 });
    expect(env).toEqual({ id: 'id-1', ok: true, data: { x: 1 } });
  });

  it('makeError wraps CloakError', () => {
    const env = makeError('id-2', new CloakError('TIMEOUT', 'slow', { ms: 100 }));
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('TIMEOUT');
    expect(env.error.message).toBe('slow');
    expect(env.error.details).toEqual({ ms: 100 });
  });

  it('makeError handles plain Error', () => {
    const env = makeError('id-3', new Error('boom'));
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe('INTERNAL_ERROR');
  });
});
