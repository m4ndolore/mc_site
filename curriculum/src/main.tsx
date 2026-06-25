import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CurriculumPage from "./components/CurriculumPage";
import "./styles/globals.css";

// Load shared mc-site navbar + styles. Paths are constructed in JS so
// Vite's base-path rewriting doesn't prefix them with /curriculum/.
// In production the browser is on mergecombinator.com, so "/" resolves
// to the main mc-site origin (not the curriculum Pages project).
function bootstrapSharedAssets(): void {
  // Shared stylesheets
  for (const href of ["/styles.css", "/styles/light-theme.css"]) {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }

  // FOUC prevention (matches main site pattern)
  const theme = localStorage.getItem("mc-theme") ??
    (window.matchMedia?.("(prefers-color-scheme:light)").matches ? "light" : "dark");
  if (theme === "light") {
    document.documentElement.classList.add("light-theme");
  }

  // Navbar mount + script.
  // In dev, load navbar.js from the main site origin (port 3000) so its
  // module imports (@sentry/browser, ./theme.js) resolve against that
  // server's Vite dependency graph, not the curriculum server's.
  const root = document.getElementById("root");
  if (root && !document.getElementById("mc-navbar")) {
    const mount = document.createElement("div");
    mount.id = "mc-navbar";
    root.parentElement!.insertBefore(mount, root);
  }
  const navSrc = import.meta.env.DEV
    ? "http://localhost:3000/js/navbar.js"
    : "/js/navbar.js";
  if (!document.querySelector(`script[src="${navSrc}"]`)) {
    const script = document.createElement("script");
    script.type = "module";
    script.src = navSrc;
    document.body.appendChild(script);
  }
}

bootstrapSharedAssets();

// Get funderId from URL params
const funderId = new URLSearchParams(window.location.search).get("funderId") ?? undefined;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CurriculumPage funderId={funderId} />
  </StrictMode>,
);

// FOUC prevention: mark page as ready
document.body.classList.add("page-ready");
