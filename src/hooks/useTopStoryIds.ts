import { useQuery } from '@tanstack/react-query'
import { fetchTopStoryIds } from '../api/hackerNews'

export function useTopStoryIds(limit: number) {
  return useQuery({
    queryKey: ['topStoryIds', limit],
    queryFn: async () => (await fetchTopStoryIds()).slice(0, limit),
  })
}
