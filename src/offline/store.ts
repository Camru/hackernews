import type {Comment, Story} from '../types';
import {clearSnapshot, readSnapshot, writeSnapshot} from './snapshot';
import {SYNC_MAX_AGE_MS, syncOfflineSnapshot, type SyncProgress} from './sync';

export interface OfflineState {
  status: 'idle' | 'syncing' | 'error';
  syncedAt: number | null;
  stories: Story[];
  progress: SyncProgress | null;
  error: string | null;
}

const INITIAL_STATE: OfflineState = {
  status: 'idle',
  syncedAt: null,
  stories: [],
  progress: null,
  error: null,
};

// Kept as plain module variables rather than part of `state` below: they can
// be a few MB, and `useSyncExternalStore`'s snapshot must be cheap and
// referentially stable, not a multi-megabyte Map recreated on every read.
let comments = new Map<number, Comment>();
let storiesById = new Map<number, Story>();

// Replaced (not mutated) on every change so `useSyncExternalStore` consumers
// re-render — mutating this object in place would make getSnapshot() return
// the same reference forever and React would never notice the update.
let state: OfflineState = INITIAL_STATE;

const listeners = new Set<() => void>();
let initialized = false;
let currentAbortController: AbortController | null = null;
let lastAutoSyncAttempt = 0;
const AUTO_SYNC_DEBOUNCE_MS = 5_000;

function setState(next: OfflineState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): OfflineState {
  return state;
}

export function getOfflineStory(id: number): Story | undefined {
  return storiesById.get(id);
}

export function getOfflineComment(id: number): Comment | undefined {
  return comments.get(id);
}

export function getOfflineSyncedAt(): number | undefined {
  return state.syncedAt ?? undefined;
}

// Must be awaited before the app renders: `initialData` on useStory/useComment
// reads `comments`/`storiesById` synchronously at query-creation time, so a
// component mounted offline before this resolves would create a
// paused-pending query with no data and never recover.
export async function initOfflineStore(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const snapshot = await readSnapshot();
  if (snapshot) {
    comments = snapshot.comments;
    storiesById = new Map(snapshot.stories.map((story) => [story.id, story]));
    setState({
      status: 'idle',
      syncedAt: snapshot.syncedAt,
      stories: snapshot.stories,
      progress: null,
      error: null,
    });
  }

  window.addEventListener('online', () => {
    maybeAutoSync();
  });
}

export async function runSync(): Promise<void> {
  if (state.status === 'syncing') return;

  currentAbortController = new AbortController();
  const {signal} = currentAbortController;
  setState({...state, status: 'syncing', progress: null, error: null});

  try {
    const result = await syncOfflineSnapshot({
      signal,
      onProgress: (progress) => {
        setState({...state, progress});
      },
    });
    await writeSnapshot(result);
    comments = result.comments;
    storiesById = new Map(result.stories.map((story) => [story.id, story]));
    setState({
      status: 'idle',
      syncedAt: result.syncedAt,
      stories: result.stories,
      progress: null,
      error: null,
    });
    // Best-effort: ask the browser not to evict the snapshot under storage
    // pressure. Unsupported in some browsers, and not worth failing over.
    void navigator.storage?.persist?.();
  } catch (error) {
    if (signal.aborted) {
      setState({...state, status: 'idle', progress: null});
    } else {
      const message =
        error instanceof Error ? error.message : 'Sync failed.';
      setState({...state, status: 'error', progress: null, error: message});
    }
  } finally {
    currentAbortController = null;
  }
}

export function cancelSync(): void {
  currentAbortController?.abort();
}

export async function clearOffline(): Promise<void> {
  await clearSnapshot();
  comments = new Map();
  storiesById = new Map();
  setState(INITIAL_STATE);
}

export function maybeAutoSync(): void {
  if (!navigator.onLine || state.status === 'syncing') return;
  // @ts-expect-error -- navigator.connection is not in the standard lib yet.
  if (navigator.connection?.saveData) return;

  const now = Date.now();
  if (now - lastAutoSyncAttempt < AUTO_SYNC_DEBOUNCE_MS) return;
  lastAutoSyncAttempt = now;

  if (state.syncedAt !== null && now - state.syncedAt < SYNC_MAX_AGE_MS) return;

  void runSync();
}
