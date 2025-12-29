
  Cloudflare Redirect Rule (expression + target)
  Use two rules (one per hostname) or a single expression with in.

  Expression:

  (http.host in {"www.sigmablox.com" "sigmablox.com"})

  Target URL (preserve path + query):

  https://mergecombinator.com/combine${uri.path}${if(len(uri.query) > 0, "?" + uri.query, "")}

  Status code:

  - Start with 302 (Temporary)
  - Switch to 301 when confident

  Optional exclusions
  If you want to keep certain paths on sigmablox (example /login and /admin), use:

  (http.host in {"www.sigmablox.com" "sigmablox.com"} and not starts_with(http.request.uri.path, "/login") and not starts_with(http.request.uri.path, "/
  admin"))

  Worker snippet (drop‑in)

  export default {
    async fetch(request) {
      const url = new URL(request.url);
      const host = url.hostname;
      const excluded = ["/login", "/admin"]; // edit or remove

      if (host === "www.sigmablox.com" || host === "sigmablox.com") {
        const path = url.pathname;

        if (!excluded.some((prefix) => path.startsWith(prefix))) {
          const target = new URL("https://mergecombinator.com/combine");
          const suffix = path === "/" ? "" : path;
          target.pathname = `/combine${suffix}`;
          target.search = url.search;

          return Response.redirect(target.toString(), 302);
        }
      }

      return fetch(request);
    },
  };