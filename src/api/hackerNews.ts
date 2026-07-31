import type { Comment, Story } from '../types'

const BASE_URL = 'https://hacker-news.firebaseio.com/v0'

export type Feed = 'top' | 'best' | 'ask'

async function fetchItem<T>(id: number): Promise<T> {
  const response = await fetch(`${BASE_URL}/item/${id}.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch item ${id}: ${response.status}`)
  }
  return response.json()
}

export async function fetchStoryIds(feed: Feed): Promise<number[]> {
  const response = await fetch(`${BASE_URL}/${feed}stories.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${feed} stories: ${response.status}`)
  }
  return response.json()
}

export function fetchStory(id: number): Promise<Story> {
  return fetchItem<Story>(id)
}

export function fetchComment(id: number): Promise<Comment> {
  return fetchItem<Comment>(id)
}
