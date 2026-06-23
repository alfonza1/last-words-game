// ---------------------------------------------------------------------------
// Client monitoring hook. PLACEHOLDER: captures uncaught errors to the console
// so nothing is lost today. To enable Sentry later: `npm i @sentry/react`, set
// VITE_SENTRY_DSN, and initialise it where marked. See docs/DEPLOYMENT.md.
// ---------------------------------------------------------------------------
export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (dsn) {
    // TODO(setup): once @sentry/react is installed, initialise it here, e.g.
    //   import * as Sentry from '@sentry/react';
    //   Sentry.init({ dsn, tracesSampleRate: 0.1 });
    console.info('[dk] monitoring DSN present — install @sentry/react to enable.');
  }

  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => console.error('[dk] uncaught error', e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => console.error('[dk] unhandled rejection', e.reason));
}
