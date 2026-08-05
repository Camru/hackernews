import { onlineManager, useQuery } from '@tanstack/react-query'
import { fetchStory } from '../api/hackerNews'
import { getOfflineStory, getOfflineSyncedAt } from '../offline/store'

export function useStory(id: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['story', id],
    queryFn: ({ signal }) => fetchStory(id, signal),
    enabled: options.enabled,
    // Only fall back to the offline snapshot while actually offline — the
    // snapshot's comment trees are pruned/capped, so using it while online
    // would flash a truncated view before the live fetch fills it back in.
    initialData: () => (onlineManager.isOnline() ? undefined : getOfflineStory(id)),
    initialDataUpdatedAt: getOfflineSyncedAt,
  })
}
