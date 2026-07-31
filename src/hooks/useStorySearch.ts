import { useQuery } from '@tanstack/react-query'
import { MIN_SEARCH_QUERY_LENGTH, searchStories } from '../api/algolia'
import { useDebouncedValue } from './useDebouncedValue'

export function useStorySearch(query: string) {
  const debouncedQuery = useDebouncedValue(query.trim(), 300)

  return useQuery({
    queryKey: ['searchStories', debouncedQuery],
    queryFn: ({ signal }) => searchStories(debouncedQuery, signal),
    enabled: debouncedQuery.length >= MIN_SEARCH_QUERY_LENGTH,
  })
}
