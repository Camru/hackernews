import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { queryClient } from './queryClient'
import { initOfflineStore, maybeAutoSync } from './offline/store'

registerSW({ immediate: true })

// Awaited before the first render: useStory/useComment read the offline
// snapshot synchronously via `initialData`, so mounting before this resolves
// would leave an offline session permanently stuck on loading skeletons.
await initOfflineStore()
maybeAutoSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
