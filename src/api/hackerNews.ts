import type { Comment, Story } from '../types'

const BASE_URL = 'https://hacker-news.firebaseio.com/v0'

async function fetchItem<T>(id: number): Promise<T> {
  const response = await fetch(`${BASE_URL}/item/${id}.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch item ${id}: ${response.status}`)
  }
  return response.json()
}

export async function fetchTopStoryIds(): Promise<number[]> {
  const response = await fetch(`${BASE_URL}/topstories.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch top stories: ${response.status}`)
  }
  return response.json()
}

export function fetchStory(id: number): Promise<Story> {
  return fetchItem<Story>(id)
}

export function fetchComment(id: number): Promise<Comment> {
  return fetchItem<Comment>(id)
}

export async function fetchTopStories(limit: number): Promise<Story[]> {
  const ids = await fetchTopStoryIds()
  const stories = await Promise.all(ids.slice(0, limit).map(fetchStory))
  return stories
}
