import { useQuery } from '@tanstack/react-query'
import { MIN_SEARCH_QUERY_LENGTH, searchComments } from '../api/algolia'
import { useDebouncedValue } from './useDebouncedValue'

export function useCommentSearch(storyId: number, query: string) {
  const debouncedQuery = useDebouncedValue(query.trim(), 300)

  return useQuery({
    queryKey: ['searchComments', storyId, debouncedQuery],
    queryFn: ({ signal }) => searchComments(storyId, debouncedQuery, signal),
    enabled: debouncedQuery.length >= MIN_SEARCH_QUERY_LENGTH,
  })
}
