import {useSyncExternalStore} from 'react';
import {
  cancelSync,
  clearOffline,
  getSnapshot,
  runSync,
  subscribe,
} from '../offline/store';

export function useOfflineSnapshot() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  return {state, sync: runSync, cancel: cancelSync, clear: clearOffline};
}
