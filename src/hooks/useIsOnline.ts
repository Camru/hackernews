import {onlineManager} from '@tanstack/react-query';
import {useSyncExternalStore} from 'react';

// Reuses React Query's onlineManager rather than raw `online`/`offline`
// listeners so the app's notion of connectivity always agrees with the
// query layer's (e.g. what gates paused fetches and initialData above).
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
  );
}
