import {fetchComment, fetchStory, fetchStoryIds} from '../api/hackerNews';
import {AUTO_EXPAND_DEPTH} from '../components/CommentItem';
import type {Comment, Story} from '../types';

export const OFFLINE_STORY_COUNT = 10;
export const SYNC_MAX_AGE_MS = 6 * 60 * 60 * 1000;

const CONCURRENCY = 12;
const MAX_NODES_PER_STORY = 800;
const MAX_TOTAL_NODES = 3000;
const SYNC_DEADLINE_MS = 90_000;

export interface SyncProgress {
  storiesDone: number;
  storiesTotal: number;
  nodesFetched: number;
}

export interface SyncResult {
  syncedAt: number;
  stories: Story[];
  comments: Map<number, Comment>;
}

interface SyncOptions {
  signal?: AbortSignal;
  onProgress?: (progress: SyncProgress) => void;
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

// Any depth cap or size ceiling below truncates the tree. This enforces the
// invariant that every id reachable via `kids` actually exists in
// `comments`, so a truncated branch renders as "no replies" rather than a
// comment stuck loading forever with no network to ever resolve it.
function pruneUnreachableKids(
  stories: Story[],
  comments: Map<number, Comment>,
): void {
  for (const story of stories) {
    story.kids = (story.kids ?? []).filter((id) => comments.has(id));
  }
  for (const comment of comments.values()) {
    comment.kids = (comment.kids ?? []).filter((id) => comments.has(id));
  }
}

export async function syncOfflineSnapshot({
  signal,
  onProgress,
}: SyncOptions = {}): Promise<SyncResult> {
  const deadline = Date.now() + SYNC_DEADLINE_MS;
  const comments = new Map<number, Comment>();

  function hasTimeLeft(): boolean {
    return !signal?.aborted && Date.now() < deadline;
  }

  const topIds = await fetchStoryIds('top', signal);
  const storyIds = topIds.slice(0, OFFLINE_STORY_COUNT);
  const fetchedStories = await mapLimitSettled(storyIds, CONCURRENCY, (id) =>
    fetchStory(id, signal),
  );
  // Re-order to the original "top" ranking — mapLimitSettled resolves in
  // completion order, not request order, and this ranking is what the
  // offline list's rank numbers should reflect.
  const storyById = new Map(fetchedStories.map((story) => [story.id, story]));
  const stories = storyIds
    .map((id) => storyById.get(id))
    .filter((story): story is Story => story !== undefined);

  let totalNodes = stories.length;
  onProgress?.({
    storiesDone: 0,
    storiesTotal: stories.length,
    nodesFetched: totalNodes,
  });

  for (const [index, story] of stories.entries()) {
    let frontier = story.kids ?? [];
    let storyNodes = 0;

    for (let depth = 0; depth <= AUTO_EXPAND_DEPTH; depth++) {
      if (frontier.length === 0 || !hasTimeLeft()) break;
      if (storyNodes >= MAX_NODES_PER_STORY || totalNodes >= MAX_TOTAL_NODES) {
        break;
      }

      const budget = Math.max(
        0,
        Math.min(
          frontier.length,
          MAX_NODES_PER_STORY - storyNodes,
          MAX_TOTAL_NODES - totalNodes,
        ),
      );
      const idsToFetch = frontier.slice(0, budget);

      const fetched = await mapLimitSettled(idsToFetch, CONCURRENCY, (id) =>
        fetchComment(id, signal),
      );
      for (const comment of fetched) {
        comments.set(comment.id, comment);
      }
      storyNodes += fetched.length;
      totalNodes += fetched.length;

      frontier = fetched.flatMap((comment) => comment.kids ?? []);
    }

    onProgress?.({
      storiesDone: index + 1,
      storiesTotal: stories.length,
      nodesFetched: totalNodes,
    });
  }

  pruneUnreachableKids(stories, comments);

  return {syncedAt: Date.now(), stories, comments};
}
