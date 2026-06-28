// Cloudflare Pages function for curriculum SPA routing
export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Route curriculum SPA requests to /curriculum/index.html
  if (url.pathname.startsWith('/curriculum/')) {
    // For root /curriculum/, serve index.html
    if (url.pathname === '/curriculum/' || url.pathname === '/curriculum') {
      return context.env.ASSETS.fetch(
        new Request(new URL('/curriculum/index.html', url.origin), context.request)
      );
    }

    // For /curriculum/* that don't have file extensions, try /curriculum/index.html
    if (!url.pathname.includes('.')) {
      return context.env.ASSETS.fetch(
        new Request(new URL('/curriculum/index.html', url.origin), context.request)
      );
    }
  }

  // Default: serve the requested file
  return context.env.ASSETS.fetch(context.request);
}
