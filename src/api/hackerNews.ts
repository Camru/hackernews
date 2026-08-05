import type {Comment, Story} from '../types';

const BASE_URL = 'https://hacker-news.firebaseio.com/v0';

export type Feed = 'top' | 'best' | 'ask';

async function fetchItem<T>(id: number, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE_URL}/item/${id}.json`, {signal});
  if (!response.ok) {
    throw new Error(`Failed to fetch item ${id}: ${response.status}`);
  }
  return response.json();
}

export async function fetchStoryIds(
  feed: Feed,
  signal?: AbortSignal,
): Promise<number[]> {
  const response = await fetch(`${BASE_URL}/${feed}stories.json`, {signal});
  if (!response.ok) {
    throw new Error(`Failed to fetch ${feed} stories: ${response.status}`);
  }
  return response.json();
}

export function fetchStory(id: number, signal?: AbortSignal): Promise<Story> {
  return fetchItem<Story>(id, signal);
}

export function fetchComment(
  id: number,
  signal?: AbortSignal,
): Promise<Comment> {
  return fetchItem<Comment>(id, signal);
}
