import {get, set, del} from 'idb-keyval';
import type {Comment, Story} from '../types';

const SNAPSHOT_KEY = 'hn-offline-snapshot';
const SNAPSHOT_VERSION = 1;

export interface OfflineSnapshot {
  version: number;
  syncedAt: number;
  // `kids` on every story/comment below (in both `stories` and
  // `savedStories`) is pruned to ids that are actually present in
  // `comments` — a depth cap or size ceiling truncates the tree, and an
  // unpruned `kids` entry pointing at a missing id would render as a
  // comment stuck loading forever with no network to ever resolve it.
  stories: Story[];
  savedStories: Story[];
  comments: Map<number, Comment>;
}

interface StoredSnapshot {
  version: number;
  syncedAt: number;
  stories: Story[];
  // Optional because snapshots written before saved-story caching existed
  // won't have this field — normalized to [] below rather than bumping the
  // version and discarding an otherwise-perfectly-usable snapshot.
  savedStories?: Story[];
  comments: Map<number, Comment>;
}

export async function readSnapshot(): Promise<OfflineSnapshot | null> {
  let stored: StoredSnapshot | undefined;
  try {
    stored = await get<StoredSnapshot>(SNAPSHOT_KEY);
  } catch {
    return null;
  }
  if (!stored || stored.version !== SNAPSHOT_VERSION) {
    return null;
  }
  return {...stored, savedStories: stored.savedStories ?? []};
}

export async function writeSnapshot(
  snapshot: Omit<OfflineSnapshot, 'version'>,
): Promise<void> {
  const stored: StoredSnapshot = {version: SNAPSHOT_VERSION, ...snapshot};
  await set(SNAPSHOT_KEY, stored);
}

export async function clearSnapshot(): Promise<void> {
  await del(SNAPSHOT_KEY);
}
