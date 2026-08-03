import {useCallback, useSyncExternalStore} from 'react';

const STORAGE_KEY = 'hn-saved-story-ids';

const listeners = new Set<() => void>();

function readIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

let ids = readIds();

function setIds(next: number[]) {
  ids = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return ids;
}

// Backed by a module-level store rather than component state so every
// consumer (the header save button, the feed tab, the saved-stories view)
// stays in sync without threading state through props.
export function useSavedStories() {
  const savedIds = useSyncExternalStore(subscribe, getSnapshot);

  const save = useCallback((id: number) => {
    if (!ids.includes(id)) {
      setIds([id, ...ids]);
    }
  }, []);

  const remove = useCallback((id: number) => {
    setIds(ids.filter((savedId) => savedId !== id));
  }, []);

  return {savedIds, save, remove};
}
