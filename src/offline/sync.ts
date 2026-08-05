import {fetchComment, fetchStory, fetchStoryIds} from '../api/hackerNews';
import {AUTO_EXPAND_DEPTH} from '../components/CommentItem';
import type {Comment, Story} from '../types';

export const OFFLINE_STORY_COUNT = 10;
export const SYNC_MAX_AGE_MS = 6 * 60 * 60 * 1000;

const CONCURRENCY = 12;
const MAX_NODES_PER_STORY = 800;
const MAX_TOTAL_NODES = 3000;
const MAX_SAVED_TOTAL_NODES = 2000;
const FEED_DEADLINE_MS = 60_000;
const SYNC_DEADLINE_MS = 90_000;
const SINGLE_SYNC_DEADLINE_MS = 30_000;

export interface SyncProgress {
  storiesDone: number;
  storiesTotal: number;
  nodesFetched: number;
}

export interface SyncResult {
  syncedAt: number;
  stories: Story[];
  savedStories: Story[];
  comments: Map<number, Comment>;
}

interface SyncOptions {
  signal?: AbortSignal;
  onProgress?: (progress: SyncProgress) => void;
  savedStoryIds?: number[];
}

interface NodeBudget {
  remaining: number;
}

// Bounded-concurrency map that skips (rather than fails the whole batch on)
// any item that still errors after one retry — a handful of dead comment ids
// shouldn't sink an otherwise-good sync.
async function mapLimitSettled<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = items[index++];
      try {
        results.push(await fn(current));
      } catch {
        try {
          results.push(await fn(current));
        } catch {
          // Skip this node.
        }
      }
    }
  }

  await Promise.all(
    Array.from({length: Math.min(limit, items.length)}, worker),
  );
  return results;
}

// BFSes a single story's comment tree to AUTO_EXPAND_DEPTH — the same set of
// comments CommentItem actually mounts by default (see its own comment on
// AUTO_EXPAND_DEPTH) — against a shared node budget and deadline. Mutates
// `into` in place and returns the number of comments added.
async function fetchCommentTree(
  rootKids: number[],
  into: Map<number, Comment>,
  budget: NodeBudget,
  signal: AbortSignal | undefined,
  hasTimeLeft: () => boolean,
): Promise<number> {
  let frontier = rootKids;
  let storyNodes = 0;

  for (let depth = 0; depth <= AUTO_EXPAND_DEPTH; depth++) {
    if (frontier.length === 0 || !hasTimeLeft()) break;
    if (storyNodes >= MAX_NODES_PER_STORY || budget.remaining <= 0) break;

    const toFetch = Math.max(
      0,
      Math.min(
        frontier.length,
        MAX_NODES_PER_STORY - storyNodes,
        budget.remaining,
      ),
    );
    const idsToFetch = frontier.slice(0, toFetch);

    // Firebase returns a literal `null` body (HTTP 200) for a purged item id
    // rather than an error, so that has to be filtered out here.
    const fetched = (
      await mapLimitSettled(idsToFetch, CONCURRENCY, (id) =>
        fetchComment(id, signal),
      )
    ).filter((comment): comment is Comment => comment != null);

    for (const comment of fetched) {
      into.set(comment.id, comment);
    }
    storyNodes += fetched.length;
    budget.remaining -= fetched.length;

    frontier = fetched.flatMap((comment) => comment.kids ?? []);
  }

  return storyNodes;
}

// Any depth cap or size ceiling above truncates the tree. This enforces the
// invariant that every id reachable via `kids` actually exists among the
// comments the caller considers available — so a truncated branch renders
// as "no replies" rather than a comment stuck loading forever with no
// network to ever resolve it. `isPresent` may check a broader set than
// `toPrune` itself (e.g. a boundary reply already cached by a different
// sync pass).
export function pruneKids(
  stories: Story[],
  toPrune: Iterable<Comment>,
  isPresent: (id: number) => boolean,
): void {
  for (const story of stories) {
    story.kids = (story.kids ?? []).filter(isPresent);
  }
  for (const comment of toPrune) {
    comment.kids = (comment.kids ?? []).filter(isPresent);
  }
}

export async function syncOfflineSnapshot({
  signal,
  onProgress,
  savedStoryIds = [],
}: SyncOptions = {}): Promise<SyncResult> {
  const feedDeadline = Date.now() + FEED_DEADLINE_MS;
  const overallDeadline = Date.now() + SYNC_DEADLINE_MS;
  const comments = new Map<number, Comment>();

  function timeLeft(deadline: number): boolean {
    return !signal?.aborted && Date.now() < deadline;
  }

  const topIds = await fetchStoryIds('top', signal);
  const feedIds = topIds.slice(0, OFFLINE_STORY_COUNT);
  const fetchedFeedStories = await mapLimitSettled(
    feedIds,
    CONCURRENCY,
    (id) => fetchStory(id, signal),
  );
  // Re-order to the original "top" ranking — mapLimitSettled resolves in
  // completion order, not request order, and this ranking is what the
  // offline list's rank numbers should reflect.
  const feedStoryById = new Map(
    fetchedFeedStories
      .filter((story): story is Story => story != null)
      .map((story) => [story.id, story]),
  );
  const stories = feedIds
    .map((id) => feedStoryById.get(id))
    .filter((story): story is Story => story !== undefined);

  // Dedupe against ids that actually landed, not the requested ones — a
  // saved story whose feed fetch failed should still get its own attempt
  // below rather than silently falling into neither list.
  const savedIdsToFetch = savedStoryIds.filter((id) => !feedStoryById.has(id));
  const fetchedSavedStories = await mapLimitSettled(
    savedIdsToFetch,
    CONCURRENCY,
    (id) => fetchStory(id, signal),
  );
  const savedStories = fetchedSavedStories.filter(
    (story): story is Story => story != null,
  );

  const storiesTotal = stories.length + savedStories.length;
  let nodesFetched = storiesTotal;
  let storiesDone = 0;
  onProgress?.({storiesDone, storiesTotal, nodesFetched});

  const feedBudget: NodeBudget = {remaining: MAX_TOTAL_NODES};
  for (const story of stories) {
    nodesFetched += await fetchCommentTree(
      story.kids ?? [],
      comments,
      feedBudget,
      signal,
      () => timeLeft(feedDeadline),
    );
    storiesDone++;
    onProgress?.({storiesDone, storiesTotal, nodesFetched});
  }

  // Saved stories are an explicit user choice and have a fallback the feed
  // doesn't — the incremental per-save sync and the startup/reconnect
  // backfill (see offline/store.ts) can fill in anything shortchanged here.
  // So they get their own budget rather than sharing MAX_TOTAL_NODES with
  // the feed, and neither set can starve the other.
  const savedBudget: NodeBudget = {remaining: MAX_SAVED_TOTAL_NODES};
  for (const story of savedStories) {
    nodesFetched += await fetchCommentTree(
      story.kids ?? [],
      comments,
      savedBudget,
      signal,
      () => timeLeft(overallDeadline),
    );
    storiesDone++;
    onProgress?.({storiesDone, storiesTotal, nodesFetched});
  }

  pruneKids([...stories, ...savedStories], comments.values(), (id) =>
    comments.has(id),
  );

  return {syncedAt: Date.now(), stories, savedStories, comments};
}

// Incremental path used when a single story is saved — fetches just that
// story's comment tree (same depth cap, own dedicated budget/deadline) so it
// doesn't have to wait for or compete with a full sync. Returns null if the
// story itself couldn't be fetched (including the purged/`null`-body case).
export async function syncSingleStory(
  id: number,
  options: {
    signal?: AbortSignal;
    existingComments?: Map<number, Comment>;
  } = {},
): Promise<{story: Story; comments: Map<number, Comment>} | null> {
  const {signal, existingComments} = options;
  const deadline = Date.now() + SINGLE_SYNC_DEADLINE_MS;

  function hasTimeLeft(): boolean {
    return !signal?.aborted && Date.now() < deadline;
  }

  let story: Story;
  try {
    const fetched = await fetchStory(id, signal);
    if (fetched == null) return null;
    story = fetched;
  } catch {
    return null;
  }

  const added = new Map<number, Comment>();
  const budget: NodeBudget = {remaining: MAX_NODES_PER_STORY};
  await fetchCommentTree(story.kids ?? [], added, budget, signal, hasTimeLeft);

  pruneKids(
    [story],
    added.values(),
    (kidId) => added.has(kidId) || (existingComments?.has(kidId) ?? false),
  );

  return {story, comments: added};
}
