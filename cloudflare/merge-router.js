const SIGMABLOX_ORIGIN = "https://www.sigmablox.com";
const SIGMABLOX_HOSTNAMES = new Set(["www.sigmablox.com", "sigmablox.com"]);

const ROUTES = [
  { prefix: "/combine", origin: SIGMABLOX_ORIGIN, stripPrefix: true, preserveRoot: true },
  { prefix: "/builders", origin: "https://www.defensebuilders.com", stripPrefix: true },
  { prefix: "/opportunities", origin: "https://sbir.mergecombinator.com", stripPrefix: true },
  { prefix: "/knowledge", origin: "https://irregularpedia.org", stripPrefix: true },
  { prefix: "/merch", origin: "https://merge-combinator-shop.fourthwall.com", stripPrefix: true },
];

const SIGMABLOX_ASSET_PREFIXES = [
  "/assets/",
  "/public/",
  "/content/",
  "/ghost/",
];

const BANNER_HTML = `
  <div data-mc-banner="true" style="position: sticky; top: 0; z-index: 2147483647; font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-bottom: 1px solid rgba(233, 242, 255, 0.12); padding: 10px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore Defense Builders -&gt;</a>
  </div>
`;

const BANNER_FOOTER_HTML = `
  <div style="font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-top: 1px solid rgba(233, 242, 255, 0.12); padding: 12px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore Defense Builders -&gt;</a>
  </div>
`;

function resolveTarget(url, route) {
  const target = new URL(route.origin);
  if (route.stripPrefix) {
    if (route.preserveRoot && (url.pathname === route.prefix || url.pathname === `${route.prefix}/`)) {
      target.pathname = `${route.prefix}/`;
    } else {
      const suffix = url.pathname === route.prefix ? "/" : url.pathname.slice(route.prefix.length);
      target.pathname = suffix || "/";
    }
  } else {
    target.pathname = url.pathname;
  }
  target.search = url.search;
  return target;
}

function shouldRewriteBanner(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/html");
}

function isRedirectResponse(response) {
  return [301, 302, 303, 307, 308].includes(response.status);
}

function rewriteSigmabloxLocation(value) {
  if (!value) return null;
  if (value.startsWith("//")) {
    const url = new URL(`https:${value}`);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      const path = url.pathname.startsWith("/combine")
        ? url.pathname.slice("/combine".length) || "/"
        : url.pathname;
      return `/combine${path}${url.search}${url.hash}`;
    }
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    const url = new URL(value);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      const path = url.pathname.startsWith("/combine")
        ? url.pathname.slice("/combine".length) || "/"
        : url.pathname;
      return `/combine${path}${url.search}${url.hash}`;
    }
    return null;
  }

  if (value.startsWith("/")) {
    if (value.startsWith("/combine")) {
      return value;
    }
    return `/combine${value}`;
  }

  return null;
}

function rewriteSigmabloxUrl(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("#")
  ) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    const url = new URL(`https:${trimmed}`);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      const path = url.pathname.startsWith("/combine")
        ? url.pathname.slice("/combine".length) || "/"
        : url.pathname;
      return `/combine${path}${url.search}${url.hash}`;
    }
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const url = new URL(trimmed);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      const path = url.pathname.startsWith("/combine")
        ? url.pathname.slice("/combine".length) || "/"
        : url.pathname;
      return `/combine${path}${url.search}${url.hash}`;
    }
    return null;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("/combine")) {
    return `/combine${trimmed}`;
  }

  return null;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
      const redirectUrl = new URL("/combine/dashboard", url.origin);
      redirectUrl.search = url.search;
      return Response.redirect(redirectUrl.toString(), 302);
    }

    const route = ROUTES.find((entry) =>
      url.pathname === entry.prefix || url.pathname.startsWith(`${entry.prefix}/`)
    );

    if (!route) {
      const isSigmabloxAsset = SIGMABLOX_ASSET_PREFIXES.some((prefix) =>
        url.pathname.startsWith(prefix)
      );

      if (isSigmabloxAsset) {
        const targetUrl = new URL(`${SIGMABLOX_ORIGIN}${url.pathname}`);
        targetUrl.search = url.search;
        return fetch(new Request(targetUrl, request));
      }

      if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
        return new Response("Worker dev: no route match.", { status: 404 });
      }

      return fetch(request);
    }

    const targetUrl = resolveTarget(url, route);
    const response = await fetch(new Request(targetUrl, request));

    if (route.origin === SIGMABLOX_ORIGIN && isRedirectResponse(response)) {
      const location = response.headers.get("location");
      const replacement = rewriteSigmabloxLocation(location);
      if (replacement) {
        const headers = new Headers(response.headers);
        headers.set("location", replacement);
        return new Response(null, { status: 302, headers });
      }
      return response;
    }

    if (route.origin !== SIGMABLOX_ORIGIN || !shouldRewriteBanner(response)) {
      return response;
    }

    let headerAdjusted = false;
    return new HTMLRewriter()
      .on("header", {
        element(element) {
          if (headerAdjusted) return;
          const existing = element.getAttribute("style") || "";
          const next = `${existing}${existing ? " " : ""}margin-top: 44px; top: 44px;`;
          element.setAttribute("style", next);
          headerAdjusted = true;
        },
      })
      .on("a", {
        element(element) {
          const href = element.getAttribute("href");
          const replacement = rewriteSigmabloxUrl(href);
          if (replacement) {
            element.setAttribute("href", replacement);
          }
        },
      })
      .on("link", {
        element(element) {
          const href = element.getAttribute("href");
          const replacement = rewriteSigmabloxUrl(href);
          if (replacement) {
            element.setAttribute("href", replacement);
          }
        },
      })
      .on("script", {
        element(element) {
          const src = element.getAttribute("src");
          const replacement = rewriteSigmabloxUrl(src);
          if (replacement) {
            element.setAttribute("src", replacement);
          }
        },
      })
      .on("img", {
        element(element) {
          const src = element.getAttribute("src");
          const replacement = rewriteSigmabloxUrl(src);
          if (replacement) {
            element.setAttribute("src", replacement);
          }
        },
      })
      .on("form", {
        element(element) {
          const action = element.getAttribute("action");
          const replacement = rewriteSigmabloxUrl(action);
          if (replacement) {
            element.setAttribute("action", replacement);
          }
        },
      })
      .on("body", {
        element(element) {
          element.prepend(BANNER_HTML, { html: true });
        },
      })
      .on("body", {
        element(element) {
          element.append(BANNER_FOOTER_HTML, { html: true });
        },
      })
      .transform(response);
  },
};
