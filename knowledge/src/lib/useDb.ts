import { useMemo, useSyncExternalStore } from "react";
import { getState, subscribe, type DbState } from "./mockDb";

// Return the whole state (reference-stable between mutations) so
// useSyncExternalStore never sees a "new" snapshot on plain renders.
// Selectors run through useMemo on top of that stable state.
export function useDb<T>(selector: (s: DbState) => T): T {
  const state = useSyncExternalStore(subscribe, getState, getState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => selector(state), [state]);
}
