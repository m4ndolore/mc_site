import * as Sentry from '@sentry/browser'

const DSN = '__YOUR_SENTRY_DSN__'

if (DSN && !DSN.startsWith('__')) {
  Sentry.init({
    dsn: DSN,
    environment: window.location.hostname === 'mergecombinator.com' ? 'production' : 'development',
    sampleRate: 1.0,
    // Ignore browser extension noise and common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      /^Loading chunk .* failed/,
    ],
  })
}
