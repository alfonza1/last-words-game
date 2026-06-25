// A scale-from-zero Cloud Run request may wait for the Java container and its
// database pool to initialize. Twenty seconds is tolerant without trapping the
// player on startup indefinitely.
export const API_REQUEST_TIMEOUT_MS = 20_000;

export class RequestTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`The server did not respond within ${Math.round(timeoutMs / 1000)} seconds.`);
    this.name = 'RequestTimeoutError';
  }
}

/**
 * Apply one deadline to the full request operation, including Firebase token
 * lookup and the network fetch. Aborting the signal also stops an in-flight
 * fetch once the deadline expires.
 */
export async function withRequestTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = API_REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new RequestTimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation(controller.signal), timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}
