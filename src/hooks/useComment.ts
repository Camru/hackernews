import { useQuery } from '@tanstack/react-query'
import { fetchComment } from '../api/hackerNews'

export function useComment(id: number) {
  return useQuery({
    queryKey: ['comment', id],
    queryFn: () => fetchComment(id),
  })
}
