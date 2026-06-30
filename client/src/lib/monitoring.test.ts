import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sentry = vi.hoisted(() => ({
  captureException: vi.fn(),
  init: vi.fn(),
}));

vi.mock('@sentry/react', () => sentry);

describe('monitoring', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_SENTRY_DSN', '');
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', '');
    sentry.captureException.mockClear();
    sentry.init.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('initializes Sentry when a DSN is configured', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.ingest.sentry.io/1');
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'production');

    const { initMonitoring } = await import('./monitoring');

    initMonitoring();

    expect(sentry.init).toHaveBeenCalledWith({
      dsn: 'https://public@example.ingest.sentry.io/1',
      environment: 'production',
      sendDefaultPii: false,
      tracesSampleRate: 0,
    });
  });

  it('captures exceptions through Sentry after initialization', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.ingest.sentry.io/1');
    const error = new Error('boom');

    const { captureException, initMonitoring } = await import('./monitoring');

    initMonitoring();
    captureException(error, { area: 'react-render' });

    expect(sentry.captureException).toHaveBeenCalledWith(error, {
      extra: { area: 'react-render' },
    });
  });

  it('keeps reporting to the console when no DSN is configured', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('boom');

    const { captureException, initMonitoring } = await import('./monitoring');

    initMonitoring();
    captureException(error, { area: 'react-render' });

    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith('[dk] captured exception', error, { area: 'react-render' });
  });
});
