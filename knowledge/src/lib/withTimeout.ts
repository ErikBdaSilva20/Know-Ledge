// Runs an async operation with a hard deadline and a guaranteed fallback:
// resolves to `fallback` if `op` rejects OR outruns `ms`, and never rejects
// itself. Used to make session probing resilient without editing the protected
// gateway client (client.ts) — the resilience policy lives in app code, the
// client stays a thin contract. `op` is a thunk so the timer starts at call
// time, not when the promise was created.
export async function withTimeout<T>(op: () => Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([op(), timeout]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
