import { useQuery } from '@tanstack/react-query'
import { fetchStory } from '../api/hackerNews'

export function useStory(id: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['story', id],
    queryFn: () => fetchStory(id),
    enabled: options.enabled,
  })
}
