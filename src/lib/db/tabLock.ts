import { closeDatabase } from "./createDatabase";
import type { SchemaTable } from "./schema";

/**
 * PGlite flushes its whole in-memory filesystem to IndexedDB after every query, so two tabs
 * holding the same database silently overwrite each other. A Web Lock per database makes one
 * tab the owner; other tabs wait, or ask the owner to hand over.
 */

export type DatabaseLockStatus = "acquiring" | "held" | "blocked" | "taken";

type Entry = {
  status: DatabaseLockStatus;
  refs: number;
  listeners: Set<() => void>;
  release?: () => void;
  abort?: AbortController;
  releaseTimer?: number;
  takeOverTimer?: number;
};

export type TabChannelMessage =
  | { type: "release-request"; dbId: string }
  | { type: "schema-request"; dbId: string }
  | { type: "schema"; dbId: string; tables: SchemaTable[] };

const LOCK_PREFIX = "sqlens-db:";
const CHANNEL_NAME = "sqlens-db-tabs";
const TAKE_OVER_TIMEOUT_MS = 4000;

const entries = new Map<string, Entry>();
const pendingReleases = new Map<string, Promise<void>>();
const messageListeners = new Set<(message: TabChannelMessage) => void>();
let channel: BroadcastChannel | null | undefined;

export function databaseLockName(dbId: string): string {
  return `${LOCK_PREFIX}${dbId}`;
}

function locksSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.locks?.request === "function";
}

function getChannel(): BroadcastChannel | null {
  if (channel === undefined) {
    channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL_NAME);
    channel?.addEventListener("message", (event: MessageEvent<TabChannelMessage>) => {
      const message = event.data;
      if (message?.type === "release-request") void yieldToOtherTab(message.dbId);
      messageListeners.forEach((listener) => listener(message));
    });
  }
  return channel;
}

export function postTabMessage(message: TabChannelMessage): void {
  getChannel()?.postMessage(message);
}

export function onTabMessage(listener: (message: TabChannelMessage) => void): () => void {
  getChannel();
  messageListeners.add(listener);
  return () => messageListeners.delete(listener);
}

function setStatus(entry: Entry, status: DatabaseLockStatus): void {
  entry.status = status;
  entry.listeners.forEach((listener) => listener());
}

function isCurrent(dbId: string, entry: Entry): boolean {
  return entries.get(dbId) === entry && entry.refs > 0;
}

/** Close before releasing so the next owner never loads a state this tab is still flushing. */
async function releaseHeld(dbId: string, entry: Entry): Promise<void> {
  const release = entry.release;
  entry.release = undefined;
  if (!release) return;
  try {
    await closeDatabase(dbId);
  } finally {
    release();
  }
}

function requestLock(dbId: string, entry: Entry, wait: boolean): void {
  entry.abort?.abort();
  const abort = new AbortController();
  entry.abort = abort;

  navigator.locks
    .request(
      databaseLockName(dbId),
      wait ? { signal: abort.signal } : { ifAvailable: true },
      (lock) => {
        if (!isCurrent(dbId, entry)) return;
        if (!lock) {
          setStatus(entry, "blocked");
          // Queue behind the owner so this tab opens automatically once it lets go.
          requestLock(dbId, entry, true);
          return;
        }
        window.clearTimeout(entry.takeOverTimer);
        return new Promise<void>((resolve) => {
          entry.release = resolve;
          setStatus(entry, "held");
        });
      }
    )
    .catch(() => {
      /* aborted: this tab stopped wanting the database */
    });
}

async function yieldToOtherTab(dbId: string): Promise<void> {
  const entry = entries.get(dbId);
  if (!entry?.release) return;
  setStatus(entry, "taken");
  await releaseHeld(dbId, entry);
  if (isCurrent(dbId, entry)) requestLock(dbId, entry, true);
}

export function getDatabaseLockStatus(dbId: string): DatabaseLockStatus {
  if (!locksSupported()) return "held";
  return entries.get(dbId)?.status ?? "acquiring";
}

export function subscribeDatabaseLock(dbId: string, listener: () => void): () => void {
  let entry = entries.get(dbId);
  if (!entry) {
    const created: Entry = {
      status: locksSupported() ? "acquiring" : "held",
      refs: 0,
      listeners: new Set(),
    };
    entries.set(dbId, created);
    entry = created;
    if (locksSupported()) {
      getChannel();
      void (pendingReleases.get(dbId) ?? Promise.resolve()).then(() => {
        if (isCurrent(dbId, created)) requestLock(dbId, created, false);
      });
    }
  }

  const current = entry;
  window.clearTimeout(current.releaseTimer);
  current.refs += 1;
  current.listeners.add(listener);

  return () => {
    current.refs -= 1;
    current.listeners.delete(listener);
    if (current.refs > 0) return;
    // Deferred so a StrictMode remount reuses the lock instead of racing a fresh request.
    current.releaseTimer = window.setTimeout(() => {
      if (current.refs > 0 || entries.get(dbId) !== current) return;
      entries.delete(dbId);
      window.clearTimeout(current.takeOverTimer);
      current.abort?.abort();
      const done = releaseHeld(dbId, current).finally(() => {
        if (pendingReleases.get(dbId) === done) pendingReleases.delete(dbId);
      });
      pendingReleases.set(dbId, done);
    }, 0);
  };
}

/** Asks the owning tab to close the database; the queued request then grants it here. */
export function takeOverDatabase(dbId: string): void {
  const entry = entries.get(dbId);
  if (!entry || (entry.status !== "blocked" && entry.status !== "taken")) return;
  const previous = entry.status;
  setStatus(entry, "acquiring");
  postTabMessage({ type: "release-request", dbId });
  window.clearTimeout(entry.takeOverTimer);
  entry.takeOverTimer = window.setTimeout(() => {
    if (entry.status === "acquiring") setStatus(entry, previous);
  }, TAKE_OVER_TIMEOUT_MS);
}

function ownsLock(name: string): boolean {
  if (!name.startsWith(LOCK_PREFIX)) return false;
  const dbId = name.slice(LOCK_PREFIX.length);
  return entries.get(dbId)?.status === "held" || pendingReleases.has(dbId);
}

async function databaseLocksHeldElsewhere(): Promise<string[]> {
  if (!locksSupported()) return [];
  try {
    const snapshot = await navigator.locks.query();
    return (snapshot.held ?? [])
      .map((lock) => lock.name ?? "")
      .filter((name) => name.startsWith(LOCK_PREFIX) && !ownsLock(name));
  } catch {
    return [];
  }
}

export async function isDatabaseOpenInAnotherTab(dbId: string): Promise<boolean> {
  return (await databaseLocksHeldElsewhere()).includes(databaseLockName(dbId));
}

export async function countDatabasesOpenInOtherTabs(): Promise<number> {
  return (await databaseLocksHeldElsewhere()).length;
}

/**
 * Reads data without becoming the owner: briefly takes the lock if nobody holds it, otherwise
 * returns null so the caller can ask the owning tab instead.
 */
export async function withDatabaseIfFree<T>(
  dbId: string,
  read: () => Promise<T>
): Promise<T | null> {
  if (!locksSupported()) return read();
  await pendingReleases.get(dbId);
  return navigator.locks.request(databaseLockName(dbId), { ifAvailable: true }, async (lock) => {
    if (!lock) return null;
    try {
      return await read();
    } finally {
      await closeDatabase(dbId);
    }
  });
}
