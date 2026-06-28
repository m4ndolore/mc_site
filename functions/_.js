export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Handle curriculum SPA routing
  if (url.pathname.startsWith('/curriculum/')) {
    // Serve /curriculum/index.html for all non-asset requests
    if (!url.pathname.includes('.')) {
      return context.env.ASSETS.fetch(
        new Request(new URL('/curriculum/index.html', url.origin), context.request)
      );
    }
  }

  // Default behavior
  return context.env.ASSETS.fetch(context.request);
}
