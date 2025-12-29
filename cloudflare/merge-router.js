const ROUTES = [
  { prefix: "/combine", origin: "https://www.sigmablox.com" },
  { prefix: "/builders", origin: "https://www.defensebuilders.com" },
  { prefix: "/opportunities", origin: "https://sbir.mergecombinator.com" },
  { prefix: "/knowledge", origin: "https://irregularpedia.org" },
  { prefix: "/merch", origin: "https://merge-combinator-shop.fourthwall.com" },
];

function resolveTarget(url, route) {
  const target = new URL(route.origin);
  const suffix = url.pathname === route.prefix ? "/" : url.pathname.slice(route.prefix.length);
  target.pathname = suffix;
  target.search = url.search;
  return target;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const route = ROUTES.find((entry) =>
      url.pathname === entry.prefix || url.pathname.startsWith(`${entry.prefix}/`)
    );

    if (!route) {
      return fetch(request);
    }

    const targetUrl = resolveTarget(url, route);
    return fetch(new Request(targetUrl, request));
  },
};
