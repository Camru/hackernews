import { useQuery } from '@tanstack/react-query'
import { fetchComment } from '../api/hackerNews'
import { getOfflineComment, getOfflineSyncedAt } from '../offline/store'

export function useComment(id: number) {
  return useQuery({
    queryKey: ['comment', id],
    queryFn: ({ signal }) => fetchComment(id, signal),
    // See useStory.ts for why this doesn't gate on onlineManager/navigator.onLine,
    // and why placeholderData is also needed alongside initialData.
    initialData: () => getOfflineComment(id),
    initialDataUpdatedAt: getOfflineSyncedAt,
    placeholderData: () => getOfflineComment(id),
  })
}
