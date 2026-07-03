import { useSyncExternalStore } from 'react';
import { getContent, subscribe } from './contentStore';

// Public components read site/works through this hook. In normal mode it returns
// the bundled content and never re-renders; in preview mode it re-renders when
// the editor pushes a new draft.
export function useContent() {
  return useSyncExternalStore(subscribe, getContent, getContent);
}
