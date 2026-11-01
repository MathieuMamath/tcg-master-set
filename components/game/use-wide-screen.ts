import { useSyncExternalStore } from 'react';

const WIDE_SCREEN = '(min-width: 900px) and (min-height: 500px)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE_SCREEN);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

// Wide enough for both pages of an open binder.
export function useWideScreen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE_SCREEN).matches,
    () => false,
  );
}
