import { useQuery } from '@tanstack/react-query'
import { fetchStoryIds, type Feed } from '../api/hackerNews'

export function useStoryIds(feed: Feed, limit: number) {
  return useQuery({
    queryKey: ['storyIds', feed, limit],
    queryFn: async () => (await fetchStoryIds(feed)).slice(0, limit),
  })
}
