/**
 * JSON line protocol over Unix socket.
 *
 * Wire format: one JSON object per line.
 * Request : { id: string, method: string, params: object }
 * Response: { id: string, ok: true, data: any } | { id: string, ok: false, error: {code, message, details?} }
 */

import { createInterface, type Interface } from 'node:readline';
import type { Socket } from 'node:net';
import { CloakError, fromUnknown } from '../errors.js';

export type RpcRequest = {
  id: string;
  method: string;
  params?: Record<string, unknown>;
};

export type RpcResponseOk = {
  id: string;
  ok: true;
  data: unknown;
};

export type RpcResponseErr = {
  id: string;
  ok: false;
  error: ReturnType<CloakError['toJSON']>;
};

export type RpcResponse = RpcResponseOk | RpcResponseErr;

export function send(sock: Socket, msg: RpcRequest | RpcResponse): boolean {
  return sock.write(JSON.stringify(msg) + '\n');
}

export function readLines(sock: Socket): Interface {
  return createInterface({ input: sock, crlfDelay: Infinity });
}

let counter = 0;
export function nextId(): string {
  counter += 1;
  return `${process.pid}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function makeError(id: string, err: unknown): RpcResponseErr {
  const cloak = fromUnknown(err);
  return { id, ok: false, error: cloak.toJSON() };
}

export function makeOk(id: string, data: unknown): RpcResponseOk {
  return { id, ok: true, data };
}
