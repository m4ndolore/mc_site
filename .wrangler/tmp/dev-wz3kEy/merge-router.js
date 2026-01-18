var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// cloudflare/merge-router.js
var SIGMABLOX_ORIGIN = "https://www.sigmablox.com";
var SIGMABLOX_HOSTNAMES = /* @__PURE__ */ new Set(["www.sigmablox.com", "sigmablox.com"]);
var ROUTES = [
  { prefix: "/combine", origin: SIGMABLOX_ORIGIN, stripPrefix: true, preserveRoot: true },
  { prefix: "/builders", origin: "https://www.defensebuilders.com", stripPrefix: true },
  { prefix: "/opportunities", origin: "https://sbir.mergecombinator.com", stripPrefix: true },
  { prefix: "/knowledge", origin: "https://irregularpedia.org", stripPrefix: true },
  { prefix: "/merch", origin: "https://merge-combinator-shop.fourthwall.com", stripPrefix: true }
];
var SIGMABLOX_ASSET_PREFIXES = [
  "/assets/",
  "/public/",
  "/content/",
  "/ghost/"
];
var BANNER_HTML = `
  <div data-mc-banner="true" style="position: sticky; top: 0; z-index: 2147483647; font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-bottom: 1px solid rgba(233, 242, 255, 0.12); padding: 10px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore Defense Builders -&gt;</a>
  </div>
`;
var BANNER_FOOTER_HTML = `
  <div style="font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif; background: #0b1116; color: #e9f2ff; border-top: 1px solid rgba(233, 242, 255, 0.12); padding: 12px 16px; text-align: center; letter-spacing: 0.02em;">
    <span style="opacity: 0.9;">Brought to you by Merge Combinator. Build what warfighters need.</span>
    <a href="/builders" style="margin-left: 12px; color: #7fd1ff; text-decoration: none; font-weight: 600;">Explore Defense Builders -&gt;</a>
  </div>
`;
var SHIM_HTML = `
  <script>
    (function () {
      if (!location.pathname.startsWith("/combine")) return;
      var prefix = "/combine";
      var localApiOrigin = null;
      if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        localApiOrigin = "http://localhost:2368";
      }
      function rewriteUrl(input) {
        if (!input) return input;
        try {
          if (typeof input === "string") {
            if (localApiOrigin && input.startsWith("https://api.sigmablox.com")) {
              return localApiOrigin + input.slice("https://api.sigmablox.com".length);
            }
            if (input.startsWith("/") && !input.startsWith(prefix)) {
              return prefix + input;
            }
            if (input.startsWith(location.origin)) {
              var url = new URL(input);
              if (!url.pathname.startsWith(prefix)) {
                url.pathname = prefix + url.pathname;
              }
              return url.toString();
            }
            return input;
          }
          return input;
        } catch (e) {
          return input;
        }
      }

      var originalFetch = window.fetch;
      if (originalFetch) {
        window.fetch = function (input, init) {
          if (typeof input === "string") {
            return originalFetch.call(this, rewriteUrl(input), init);
          }
          if (input instanceof Request) {
            var rewritten = rewriteUrl(input.url);
            if (rewritten !== input.url) {
              var cloned = input.clone();
              return originalFetch.call(this, new Request(rewritten, cloned), init);
            }
          }
          return originalFetch.call(this, input, init);
        };
      }

      var originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url) {
        var rewritten = rewriteUrl(url);
        return originalOpen.apply(this, [method, rewritten].concat([].slice.call(arguments, 2)));
      };

      if (navigator.sendBeacon) {
        var originalBeacon = navigator.sendBeacon.bind(navigator);
        navigator.sendBeacon = function (url, data) {
          return originalBeacon(rewriteUrl(url), data);
        };
      }
    })();
  <\/script>
`;
function resolveTarget(url, route) {
  const target = new URL(route.origin);
  if (route.stripPrefix) {
    if (route.preserveRoot && (url.pathname === route.prefix || url.pathname === `${route.prefix}/`)) {
      target.pathname = "/";
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
__name(resolveTarget, "resolveTarget");
function shouldRewriteBanner(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/html");
}
__name(shouldRewriteBanner, "shouldRewriteBanner");
function isRedirectResponse(response) {
  return [301, 302, 303, 307, 308].includes(response.status);
}
__name(isRedirectResponse, "isRedirectResponse");
function rewriteSigmabloxLocation(value) {
  if (!value) return null;
  if (value.startsWith("//")) {
    const url = new URL(`https:${value}`);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      return `/combine${url.pathname}${url.search}${url.hash}`;
    }
    return null;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const url = new URL(value);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      return `/combine${url.pathname}${url.search}${url.hash}`;
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
__name(rewriteSigmabloxLocation, "rewriteSigmabloxLocation");
function rewriteSigmabloxUrl(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:") || trimmed.startsWith("javascript:") || trimmed.startsWith("#")) {
    return null;
  }
  if (trimmed.startsWith("//")) {
    const url = new URL(`https:${trimmed}`);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      return `/combine${url.pathname}${url.search}${url.hash}`;
    }
    return null;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const url = new URL(trimmed);
    if (SIGMABLOX_HOSTNAMES.has(url.hostname)) {
      return `/combine${url.pathname}${url.search}${url.hash}`;
    }
    return null;
  }
  if (trimmed.startsWith("/") && !trimmed.startsWith("/combine")) {
    return `/combine${trimmed}`;
  }
  if (trimmed === "/combine" || trimmed === "/combine/") {
    return "/combine/combine/";
  }
  return null;
}
__name(rewriteSigmabloxUrl, "rewriteSigmabloxUrl");
var merge_router_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
      const redirectUrl = new URL("/combine/dashboard", url.origin);
      redirectUrl.search = url.search;
      return Response.redirect(redirectUrl.toString(), 302);
    }
    const route = ROUTES.find(
      (entry) => url.pathname === entry.prefix || url.pathname.startsWith(`${entry.prefix}/`)
    );
    if (!route) {
      const isSigmabloxAsset = SIGMABLOX_ASSET_PREFIXES.some(
        (prefix) => url.pathname.startsWith(prefix)
      );
      if (isSigmabloxAsset) {
        const targetUrl2 = new URL(`${SIGMABLOX_ORIGIN}${url.pathname}`);
        targetUrl2.search = url.search;
        return fetch(new Request(targetUrl2, request));
      }
      if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
        return new Response("Worker dev: no route match.", { status: 404 });
      }
      return fetch(request);
    }
    const targetUrl = resolveTarget(url, route);
    let response = await fetch(new Request(targetUrl, request));
    if (route.origin === SIGMABLOX_ORIGIN && isRedirectResponse(response)) {
      const location = response.headers.get("location");
      let replacement = rewriteSigmabloxLocation(location);
      const isCombineDeep = url.pathname === "/combine/combine" || url.pathname === "/combine/combine/";
      if (isCombineDeep && (replacement === "/combine" || replacement === "/combine/")) {
        replacement = "/combine/combine/";
      }
      if (replacement) {
        const isCombineRoot = route.prefix === "/combine" && (url.pathname === "/combine" || url.pathname === "/combine/");
        if (isCombineRoot && replacement.startsWith("/combine")) {
          const followUrl = new URL(replacement, url.origin);
          const followTarget = resolveTarget(followUrl, route);
          response = await fetch(new Request(followTarget, request));
        } else {
          const headers = new Headers(response.headers);
          headers.set("location", replacement);
          return new Response(null, { status: 302, headers });
        }
      } else {
        return response;
      }
    }
    if (route.origin !== SIGMABLOX_ORIGIN || !shouldRewriteBanner(response)) {
      return response;
    }
    let headerAdjusted = false;
    let shimInjected = false;
    return new HTMLRewriter().on("head", {
      element(element) {
        if (shimInjected) return;
        element.append(SHIM_HTML, { html: true });
        shimInjected = true;
      }
    }).on("header", {
      element(element) {
        if (headerAdjusted) return;
        const existing = element.getAttribute("style") || "";
        const next = `${existing}${existing ? " " : ""}margin-top: 44px; top: 44px;`;
        element.setAttribute("style", next);
        headerAdjusted = true;
      }
    }).on("a", {
      element(element) {
        const href = element.getAttribute("href");
        const replacement = rewriteSigmabloxUrl(href);
        if (replacement) {
          element.setAttribute("href", replacement);
        }
      }
    }).on("link", {
      element(element) {
        const href = element.getAttribute("href");
        const replacement = rewriteSigmabloxUrl(href);
        if (replacement) {
          element.setAttribute("href", replacement);
        }
      }
    }).on("script", {
      element(element) {
        const src = element.getAttribute("src");
        const replacement = rewriteSigmabloxUrl(src);
        if (replacement) {
          element.setAttribute("src", replacement);
        }
      }
    }).on("img", {
      element(element) {
        const src = element.getAttribute("src");
        const replacement = rewriteSigmabloxUrl(src);
        if (replacement) {
          element.setAttribute("src", replacement);
        }
      }
    }).on("form", {
      element(element) {
        const action = element.getAttribute("action");
        const replacement = rewriteSigmabloxUrl(action);
        if (replacement) {
          element.setAttribute("action", replacement);
        }
      }
    }).on("body", {
      element(element) {
        if (shimInjected) return;
        element.prepend(SHIM_HTML, { html: true });
        shimInjected = true;
      }
    }).on("body", {
      element(element) {
        element.prepend(BANNER_HTML, { html: true });
      }
    }).on("body", {
      element(element) {
        element.append(BANNER_FOOTER_HTML, { html: true });
      }
    }).transform(response);
  }
};

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-T4i9Dn/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = merge_router_default;

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-T4i9Dn/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=merge-router.js.map
