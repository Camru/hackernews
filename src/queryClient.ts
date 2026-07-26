import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // A large comment thread mounts one query per comment (potentially
      // hundreds). Refetching all of them on every window focus would hammer
      // the HN API for little benefit, so only staleTime governs refreshes.
      refetchOnWindowFocus: false,
    },
  },
})
