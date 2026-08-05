import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { queryClient } from './queryClient'
import { initOfflineStore, maybeAutoSync, syncMissingSavedStories } from './offline/store'

registerSW({ immediate: true })

// Awaited before the first render: useStory/useComment read the offline
// snapshot synchronously via `initialData`, so mounting before this resolves
// would leave an offline session permanently stuck on loading skeletons.
await initOfflineStore()
maybeAutoSync()
// Runs after maybeAutoSync, not inside initOfflineStore: this way, if a full
// sync just started, syncMissingSavedStories' per-story attempts correctly
// defer to it (see offline/store.ts) instead of racing it.
syncMissingSavedStories()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
