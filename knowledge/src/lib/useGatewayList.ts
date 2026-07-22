import { useCallback, useEffect, useState } from "react";

/**
 * Fetches a gateway repo's `list()` on mount and again whenever `refresh()`
 * is called — call it after any mutation the caller makes so the screen
 * reflects its own writes (list-then-find is the only read the generic gateway
 * mode supports, Importantdoc.md §B5).
 *
 * `list` must be a stable reference (a repo's `.list` method, not an inline
 * closure) — an unstable one would refetch on every render.
 */
export function useGatewayList<T>(list: () => Promise<T[]>): {
  data: T[];
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<T[]>([]);

  const refresh = useCallback(async () => {
    setData(await list());
  }, [list]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, refresh };
}
