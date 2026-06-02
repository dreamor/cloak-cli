import { randomUUID } from 'node:crypto';
import type { AnyBrowser, AnyContext, AnyPage, LaunchedHandle } from '../browser.js';
import { CloakError } from '../errors.js';

export type SessionRecord = {
  id: string;
  handle: LaunchedHandle;
  pages: Map<string, AnyPage>;
  activePageId: string | undefined;
  createdAt: number;
  lastActivity: number;
  ttlMs: number;
  meta: Record<string, unknown>;
};

export type PageRef = { sessionId: string; pageId: string; page: AnyPage };

export class Registry {
  private readonly sessions = new Map<string, SessionRecord>();
  private timer: NodeJS.Timeout | undefined;
  private readonly sweepIntervalMs = 60_000;

  constructor(public readonly defaultTtlMs: number = 60 * 60 * 1000) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.sweepIdle().catch(() => undefined), this.sweepIntervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async closeAll(): Promise<void> {
    const ids = Array.from(this.sessions.keys());
    await Promise.allSettled(ids.map((id) => this.closeSession(id)));
  }

  registerSession(handle: LaunchedHandle, meta: Record<string, unknown> = {}, ttlMs?: number): SessionRecord {
    const id = `s-${randomUUID().slice(0, 8)}`;
    const rec: SessionRecord = {
      id,
      handle,
      pages: new Map(),
      activePageId: undefined,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ttlMs: ttlMs ?? this.defaultTtlMs,
      meta,
    };
    this.sessions.set(id, rec);
    return rec;
  }

  registerPage(sessionId: string, page: AnyPage): string {
    const rec = this.requireSession(sessionId);
    const pageId = `p-${randomUUID().slice(0, 8)}`;
    rec.pages.set(pageId, page);
    if (!rec.activePageId) rec.activePageId = pageId;
    this.touch(sessionId);

    page.on?.('close', () => {
      rec.pages.delete(pageId);
      if (rec.activePageId === pageId) {
        const next = rec.pages.keys().next();
        rec.activePageId = next.done ? undefined : next.value;
      }
    });

    return pageId;
  }

  getSession(id: string): SessionRecord | undefined {
    return this.sessions.get(id);
  }

  requireSession(id: string): SessionRecord {
    const rec = this.sessions.get(id);
    if (!rec) throw new CloakError('SESSION_NOT_FOUND', `Session not found: ${id}`);
    return rec;
  }

  requirePage(sessionId: string, pageId?: string): PageRef {
    const rec = this.requireSession(sessionId);
    const resolvedId = pageId ?? rec.activePageId;
    if (!resolvedId) throw new CloakError('PAGE_NOT_FOUND', `Session ${sessionId} has no pages`);
    const page = rec.pages.get(resolvedId);
    if (!page) throw new CloakError('PAGE_NOT_FOUND', `Page not found: ${resolvedId}`);
    this.touch(sessionId);
    return { sessionId, pageId: resolvedId, page };
  }

  listSessions(): Array<{
    id: string;
    created_at: number;
    last_activity: number;
    pages: number;
    active_page: string | undefined;
    meta: Record<string, unknown>;
  }> {
    return Array.from(this.sessions.values()).map((s) => ({
      id: s.id,
      created_at: s.createdAt,
      last_activity: s.lastActivity,
      pages: s.pages.size,
      active_page: s.activePageId,
      meta: s.meta,
    }));
  }

  describeSession(id: string): {
    id: string;
    created_at: number;
    last_activity: number;
    ttl_ms: number;
    pages: Array<{ id: string; url: string; closed: boolean }>;
    active_page: string | undefined;
    meta: Record<string, unknown>;
  } {
    const s = this.requireSession(id);
    return {
      id: s.id,
      created_at: s.createdAt,
      last_activity: s.lastActivity,
      ttl_ms: s.ttlMs,
      pages: Array.from(s.pages.entries()).map(([pid, p]) => ({
        id: pid,
        url: safeUrl(p),
        closed: p.isClosed(),
      })),
      active_page: s.activePageId,
      meta: s.meta,
    };
  }

  async closeSession(id: string): Promise<boolean> {
    const rec = this.sessions.get(id);
    if (!rec) return false;
    this.sessions.delete(id);
    await rec.handle.close().catch(() => undefined);
    return true;
  }

  touch(id: string): void {
    const rec = this.sessions.get(id);
    if (rec) rec.lastActivity = Date.now();
  }

  setActivePage(sessionId: string, pageId: string): void {
    const rec = this.requireSession(sessionId);
    if (!rec.pages.has(pageId)) throw new CloakError('PAGE_NOT_FOUND', `Page not found: ${pageId}`);
    rec.activePageId = pageId;
    this.touch(sessionId);
  }

  defaultContext(sessionId: string): AnyContext | AnyBrowser {
    const rec = this.requireSession(sessionId);
    if (rec.handle.kind === 'context') return rec.handle.context;
    return rec.handle.browser;
  }

  private async sweepIdle(): Promise<void> {
    const now = Date.now();
    for (const [id, rec] of this.sessions) {
      if (now - rec.lastActivity > rec.ttlMs) {
        await this.closeSession(id);
      }
    }
  }
}

function safeUrl(p: AnyPage): string {
  try {
    return p.url();
  } catch {
    return '';
  }
}
