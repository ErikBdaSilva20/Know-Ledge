import { useCallback, useEffect, useState } from "react";
import { isGatewayMode } from "./data/dataSource";

/**
 * Bridges a mock-store selection (already reactive via useDb) with a gateway
 * repo's `list()` (fetch-on-mount + manual refresh). In mock mode `mockValue`
 * is returned as-is; in gateway mode `list` is called on mount and again
 * whenever `refresh()` is invoked — call it after any mutation the caller
 * makes so the screen reflects its own writes (list-then-find is the only
 * read the generic gateway mode supports, Importantdoc.md §B5).
 *
 * `list` must be a stable reference (a repo's `.list` method, not an inline
 * closure) — an unstable one would refetch on every render.
 */
export function useGatewayList<T>(
  mockValue: T[],
  list: () => Promise<T[]>,
): { data: T[]; refresh: () => Promise<void> } {
  const [gatewayValue, setGatewayValue] = useState<T[]>([]);

  const refresh = useCallback(async () => {
    if (!isGatewayMode()) return;
    setGatewayValue(await list());
  }, [list]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data: isGatewayMode() ? gatewayValue : mockValue, refresh };
}
