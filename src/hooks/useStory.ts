import { useQuery } from '@tanstack/react-query'
import { fetchStory } from '../api/hackerNews'
import { getOfflineStory, getOfflineSyncedAt } from '../offline/store'

export function useStory(id: number, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['story', id],
    queryFn: ({ signal }) => fetchStory(id, signal),
    enabled: options.enabled,
    // Always fall back to the offline snapshot when it has this story,
    // rather than gating on navigator.onLine/onlineManager — that signal is
    // unreliable on mobile (Safari in particular often reports "online" with
    // no real connectivity), which left comments stuck on a permanent
    // skeleton instead of falling back. initialDataUpdatedAt being the real
    // sync time means a genuinely-online mount still refetches immediately
    // once staleTime has elapsed, replacing this with live data.
    initialData: () => getOfflineStory(id),
    initialDataUpdatedAt: getOfflineSyncedAt,
    // initialData only applies once, at query creation — if this story was
    // already being fetched before connectivity dropped (created while
    // still "online"), it's stuck with no data and initialData can't help
    // retroactively. placeholderData is re-evaluated on every render where
    // data is still missing, so it catches that case too; it's a no-op
    // whenever initialData already supplied real data.
    placeholderData: () => getOfflineStory(id),
  })
}
