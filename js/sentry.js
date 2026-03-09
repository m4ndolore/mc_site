import * as Sentry from '@sentry/browser'

const DSN = 'https://218a26aea396c379302362c7238bce6f@o4511013225758720.ingest.us.sentry.io/4511013235851264'

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
