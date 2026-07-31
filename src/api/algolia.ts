import type { Story } from '../types'

const BASE_URL = 'https://hn.algolia.com/api/v1'

// Below this length Algolia queries return too many low-relevance hits to be
// useful, so callers should treat a shorter query as "not searching yet"
// rather than firing a request.
export const MIN_SEARCH_QUERY_LENGTH = 2

interface AlgoliaStoryHit {
  objectID: string
  title: string
  url?: string
  author: string
  points: number
  num_comments: number
  created_at_i: number
}

export interface AlgoliaCommentHit {
  objectID: string
  author: string
  comment_text: string
  created_at_i: number
  _highlightResult?: {
    comment_text?: {
      value: string
    }
  }
}

function mapStoryHit(hit: AlgoliaStoryHit): Story {
  return {
    id: Number(hit.objectID),
    title: hit.title,
    url: hit.url,
    by: hit.author,
    score: hit.points,
    time: hit.created_at_i,
    descendants: hit.num_comments,
  }
}

// The API's advancedSyntax mode (on by default) treats a "quoted phrase" in
// the query as an exact, non-typo-tolerant match and leaves unquoted text as
// normal fuzzy/relevance search — so callers who want exact matching just
// type the quotes themselves, and the query is passed straight through.
export async function searchStories(query: string, signal?: AbortSignal): Promise<Story[]> {
  const params = new URLSearchParams({
    query,
    tags: 'story',
    restrictSearchableAttributes: 'title',
  })
  const response = await fetch(`${BASE_URL}/search?${params}`, { signal })
  if (!response.ok) {
    throw new Error(`Failed to search stories: ${response.status}`)
  }
  const data: { hits: AlgoliaStoryHit[] } = await response.json()
  return data.hits.map(mapStoryHit)
}

export async function searchComments(
  storyId: number,
  query: string,
  signal?: AbortSignal,
): Promise<AlgoliaCommentHit[]> {
  const params = new URLSearchParams({
    query,
    tags: `comment,story_${storyId}`,
  })
  const response = await fetch(`${BASE_URL}/search?${params}`, { signal })
  if (!response.ok) {
    throw new Error(`Failed to search comments: ${response.status}`)
  }
  const data: { hits: AlgoliaCommentHit[] } = await response.json()
  return data.hits
}
