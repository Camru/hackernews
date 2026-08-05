import { onlineManager, useQuery } from '@tanstack/react-query'
import { fetchComment } from '../api/hackerNews'
import { getOfflineComment, getOfflineSyncedAt } from '../offline/store'

export function useComment(id: number) {
  return useQuery({
    queryKey: ['comment', id],
    queryFn: ({ signal }) => fetchComment(id, signal),
    // See useStory.ts for why this is gated on being offline.
    initialData: () => (onlineManager.isOnline() ? undefined : getOfflineComment(id)),
    initialDataUpdatedAt: getOfflineSyncedAt,
  })
}
