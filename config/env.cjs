function stripSlash(url) {
  return String(url || '').replace(/\/$/, '');
}

const PUBLIC_BASE_URL = stripSlash(process.env.PUBLIC_BASE_URL || '');

module.exports = {
  PUBLIC_BASE_URL,
  EXTRA_CORS_ORIGINS: (process.env.EXTRA_CORS_ORIGINS || '')
    .split(',')
    .map(s => stripSlash(s.trim()))
    .filter(Boolean),
};
