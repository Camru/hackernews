import {getSavedIds, subscribeSavedIds} from '../hooks/useSavedStories';
import type {Comment, Story} from '../types';
import {clearSnapshot, readSnapshot, writeSnapshot} from './snapshot';
import {
  SYNC_MAX_AGE_MS,
  syncOfflineSnapshot,
  syncSingleStory,
  type SyncProgress,
} from './sync';

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
// The top-10 feed and saved-story partitions are tracked separately (only
// `feedStoriesById` drives `state.stories`, the Offline tab's display list),
// then unioned into `storiesById` — what `getOfflineStory` actually reads —
// so a story that's both saved and in the feed uses whichever copy is more
// complete rather than an arbitrary one.
let feedStoriesById = new Map<number, Story>();
let savedStoriesById = new Map<number, Story>();
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

// Bumped whenever a full sync commits or the cache is cleared, so an
// incremental per-save sync that was already in flight can tell its result
// is now stale (superseded by a fresher full sync, or wiped by a clear) and
// discard itself instead of writing over newer data.
let snapshotEpoch = 0;

// Guards against `subscribeSavedIds` firing a duplicate fetch for the same
// story while an earlier one for that id is still in flight (e.g. saving
// two stories in quick succession, or a save followed by an unrelated
// unsave, both notify the same listener).
const pendingSavedSyncs = new Set<number>();

function setState(next: OfflineState) {
  state = next;
  listeners.forEach((listener) => listener());
}

// Saved stories override the feed for an overlapping id: the saved copy is
// always fetched with its own full per-story budget, while the feed shares
// one budget across all 10 stories and can be truncated for lower-ranked
// ones — so the saved copy's `kids` array is never less complete.
function rebuildStoryIndex(): void {
  storiesById = new Map([...feedStoriesById, ...savedStoriesById]);
}

async function persistSnapshot(): Promise<void> {
  await writeSnapshot({
    // Never Date.now() here: this fires from the incremental per-save path
    // too, which must not look like "the feed was just refreshed" (see
    // runSync/maybeAutoSync — bumping this would mislabel the Offline tab,
    // make React Query treat stale feed data as fresh, and push the next
    // scheduled full sync back every time any story is saved).
    syncedAt: state.syncedAt ?? 0,
    stories: [...feedStoriesById.values()],
    savedStories: [...savedStoriesById.values()],
    comments,
  });
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

// Must be awaited before the app renders: `initialData`/`placeholderData` on
// useStory/useComment read `comments`/`storiesById` synchronously, so a
// component mounted offline before this resolves would create a
// paused-pending query with no data and never recover.
export async function initOfflineStore(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const snapshot = await readSnapshot();
  if (snapshot) {
    comments = snapshot.comments;
    feedStoriesById = new Map(snapshot.stories.map((story) => [story.id, story]));
    savedStoriesById = new Map(
      snapshot.savedStories.map((story) => [story.id, story]),
    );
    rebuildStoryIndex();
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
    syncMissingSavedStories();
  });

  subscribeSavedIds(() => syncMissingSavedStories());
}

export async function runSync(): Promise<void> {
  if (state.status === 'syncing') return;

  currentAbortController = new AbortController();
  const {signal} = currentAbortController;
  setState({...state, status: 'syncing', progress: null, error: null});

  try {
    const result = await syncOfflineSnapshot({
      signal,
      savedStoryIds: getSavedIds(),
      onProgress: (progress) => {
        setState({...state, progress});
      },
    });
    await writeSnapshot(result);
    comments = result.comments;
    feedStoriesById = new Map(result.stories.map((story) => [story.id, story]));
    savedStoriesById = new Map(
      result.savedStories.map((story) => [story.id, story]),
    );
    rebuildStoryIndex();
    snapshotEpoch++;
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
    // Whether the full sync succeeded, failed, or was cancelled, any saved
    // story it didn't get to (or couldn't fully fetch, given the feed and
    // saved partitions each have their own capped budget) still needs a
    // chance via the dedicated per-story path.
    syncMissingSavedStories();
  }
}

export function cancelSync(): void {
  currentAbortController?.abort();
}

export async function clearOffline(): Promise<void> {
  await clearSnapshot();
  comments = new Map();
  feedStoriesById = new Map();
  savedStoriesById = new Map();
  storiesById = new Map();
  snapshotEpoch++;
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

// Diffs the current saved ids against what's already cached and kicks off
// an incremental sync for anything missing — covers stories saved before
// this feature existed, saved while offline (picked up here once online
// again), and a full sync's leftovers (called from runSync's `finally`).
export function syncMissingSavedStories(): void {
  for (const id of getSavedIds()) {
    void syncSavedStory(id);
  }
}

export async function syncSavedStory(id: number): Promise<void> {
  if (savedStoriesById.has(id) || pendingSavedSyncs.has(id)) return;
  // A full sync already covers every currently-saved id itself, and
  // attempting a real fetch while offline is pointless — either way, this
  // id gets another chance the next time syncMissingSavedStories runs.
  if (state.status === 'syncing' || !navigator.onLine) return;

  pendingSavedSyncs.add(id);
  const epoch = snapshotEpoch;
  try {
    const result = await syncSingleStory(id, {existingComments: comments});
    // A full sync (or a clear) landed while this was in flight — its data
    // is either already included or has superseded this attempt.
    if (!result || epoch !== snapshotEpoch) return;

    for (const [commentId, comment] of result.comments) {
      comments.set(commentId, comment);
    }
    savedStoriesById.set(id, result.story);
    rebuildStoryIndex();
    await persistSnapshot();
  } catch {
    // Best-effort — the next backfill (reconnect, or another save) retries.
  } finally {
    pendingSavedSyncs.delete(id);
  }
}
