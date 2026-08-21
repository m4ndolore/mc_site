/* Adds .in-view to .mc-fig / .mc-fig-scope elements as they scroll into view,
 * triggering the draw-in animations defined in styles/schematics.css.
 * Pages that already run their own section observer (adding .in-view to a
 * .mc-fig-scope ancestor) don't need this module. */

export function initSchematics({ threshold = 0.35, rootMargin = "0px" } = {}) {
  const targets = document.querySelectorAll(".mc-fig:not(.mc-fig-scope .mc-fig), .mc-fig-scope");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold, rootMargin }
  );

  targets.forEach((el) => observer.observe(el));
}

initSchematics();
