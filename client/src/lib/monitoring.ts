import * as Sentry from '@sentry/react';

const CLIENT_TRACES_SAMPLE_RATE = 0.0;

let monitoringEnabled = false;
let consoleFallbackInstalled = false;

export function initMonitoring(): void {
  const dsn = optionalEnv('VITE_SENTRY_DSN');

  if (!dsn) {
    monitoringEnabled = false;
    installConsoleFallback();
    return;
  }

  monitoringEnabled = true;
  Sentry.init({
    dsn,
    environment: optionalEnv('VITE_SENTRY_ENVIRONMENT') ?? import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: CLIENT_TRACES_SAMPLE_RATE,
  });
}

export function captureException(error: unknown, extra?: Record<string, unknown>): void {
  if (!monitoringEnabled) {
    console.error('[dk] captured exception', error, extra);
    return;
  }

  Sentry.captureException(error, { extra });
}

function optionalEnv(key: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function installConsoleFallback(): void {
  if (typeof window === 'undefined') return;
  if (consoleFallbackInstalled) return;

  consoleFallbackInstalled = true;
  window.addEventListener('error', (e) => console.error('[dk] uncaught error', e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => console.error('[dk] unhandled rejection', e.reason));
}
