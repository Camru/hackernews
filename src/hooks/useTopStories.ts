import { useQuery } from '@tanstack/react-query'
import { fetchTopStories } from '../api/hackerNews'

export function useTopStories(limit: number) {
  return useQuery({
    queryKey: ['topStories', limit],
    queryFn: () => fetchTopStories(limit),
  })
}
