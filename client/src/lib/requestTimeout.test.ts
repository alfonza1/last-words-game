import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequestTimeoutError, withRequestTimeout } from './requestTimeout';

afterEach(() => {
  vi.useRealTimers();
});

describe('withRequestTimeout', () => {
  it('returns an operation result before the deadline', async () => {
    await expect(withRequestTimeout(async () => 'ok', 25)).resolves.toBe('ok');
  });

  it('rejects and aborts the request signal at the deadline', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const pending = withRequestTimeout(
      async (requestSignal) => {
        signal = requestSignal;
        return new Promise<string>(() => undefined);
      },
      15_000,
    );
    const rejection = expect(pending).rejects.toBeInstanceOf(RequestTimeoutError);

    await vi.advanceTimersByTimeAsync(15_000);

    await rejection;
    expect(signal?.aborted).toBe(true);
  });
});
