// Progressive enhancement for the canonical /launch mission path.
// The storage key and event names remain unchanged so existing progress and
// analytics continue across the /curriculum -> /launch migration.
const STORAGE_KEY = "mc.curriculum.v1";
const TRIAGE_KEY = "mc-founder-path-state-v1";
const ONBOARDING_KEY = "mc-onboarding-intent-v1";
const ADVANCE_GATE = 2;

const TRIAGE_TO_STAGE = {
  "visionary-no-problem": "preflight", curious: "preflight",
  "operator-with-problem": "spot", "builder-no-problem": "spot",
  "team-with-prototype": "ready", scaling: "tension",
};
const INTENT_TO_STAGE = { exploring: "spot", building: "ready", scaling: "tension", operating: "launch" };

function track(event, props, { beacon = false } = {}) {
  const enriched = { ...props, surface: "launch" };
  if (beacon && navigator.sendBeacon && !/^localhost$|^127\./.test(location.hostname)) {
    const payload = { n: event, u: location.href, d: "mergecombinator.com", r: document.referrer || null, p: enriched };
    navigator.sendBeacon("https://plausible.io/api/event", JSON.stringify(payload));
    return;
  }
  if (typeof window.plausible === "function") window.plausible(event, { props: enriched });
}

function init() {
  const stages = [...document.querySelectorAll(".launch-stage[data-stage-id]")];
  const resources = [...document.querySelectorAll(".launch-resource-wrap[data-resource-id]")];
  const rail = document.getElementById("launchRail");
  const progress = document.getElementById("launchProgress");
  if (!stages.length || !resources.length || !rail || !progress) return;

  const stageIds = stages.map((stage) => stage.dataset.stageId);
  const stageIndex = (id) => stageIds.indexOf(id);

  function loadState() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (value && stageIds.includes(value.currentStage)) {
        return {
          currentStage: value.currentStage,
          engaged: Array.isArray(value.engaged) ? value.engaged.filter((id) => resources.some((resource) => resource.dataset.resourceId === id)) : [],
          startedFrom: value.startedFrom || null,
          bannerDismissed: Boolean(value.bannerDismissed),
        };
      }
    } catch { /* use a clean state */ }
    return null;
  }

  function mappedStart() {
    try {
      const triage = JSON.parse(localStorage.getItem(TRIAGE_KEY));
      if (triage?.stage && TRIAGE_TO_STAGE[triage.stage]) return { stage: TRIAGE_TO_STAGE[triage.stage], answer: triage.stage, source: "founder-path" };
    } catch { /* continue */ }
    try {
      const onboarding = JSON.parse(localStorage.getItem(ONBOARDING_KEY));
      if (onboarding?.intent && INTENT_TO_STAGE[onboarding.intent]) return { stage: INTENT_TO_STAGE[onboarding.intent], answer: onboarding.intent, source: "onboarding" };
    } catch { /* continue */ }
    return null;
  }

  let state = loadState();
  const mapped = state ? null : mappedStart();
  if (!state) {
    state = { currentStage: mapped?.stage || stageIds[0], engaged: [], startedFrom: mapped?.answer || null, bannerDismissed: false };
    track("Curriculum Start", { stage: state.currentStage, fromTriage: String(Boolean(mapped)), source: mapped?.source || "direct" });
    save();
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage is optional */ }
  }

  function engagedIn(stageId) {
    return resources.filter((resource) => resource.dataset.stageId === stageId && state.engaged.includes(resource.dataset.resourceId)).length;
  }

  function render() {
    const currentIndex = stageIndex(state.currentStage);
    stages.forEach((stage, index) => {
      stage.classList.toggle("is-current", index === currentIndex);
      stage.classList.toggle("is-complete", index < currentIndex);
      const count = engagedIn(stage.dataset.stageId);
      const total = resources.filter((resource) => resource.dataset.stageId === stage.dataset.stageId).length;
      const countEl = stage.querySelector(".launch-stage__count");
      if (countEl) countEl.textContent = `${count} of ${total} explored${index === stageIds.length - 1 && index === currentIndex ? " · Final stage" : ""}`;
      const advance = stage.querySelector(".launch-advance");
      const isCurrent = index === currentIndex;
      const isLast = index === stageIds.length - 1;
      if (advance) {
        advance.hidden = !isCurrent || isLast;
        if (isCurrent && !isLast) {
          advance.disabled = count < ADVANCE_GATE;
          const nextTitle = stages[index + 1].querySelector(".launch-stage__title").textContent;
          advance.textContent = count >= ADVANCE_GATE ? `Advance to ${nextTitle} →` : `Explore ${ADVANCE_GATE - count} more to advance`;
        }
      }
    });

    resources.forEach((resource) => {
      const engaged = state.engaged.includes(resource.dataset.resourceId);
      resource.classList.toggle("is-engaged", engaged);
      resource.querySelector(".launch-resource__check")?.setAttribute("aria-pressed", String(engaged));
    });

    rail.querySelectorAll("[data-rail-stage]").forEach((link) => {
      const index = stageIndex(link.dataset.railStage);
      link.classList.toggle("launch-sidebar__link--active", index === currentIndex);
      link.classList.toggle("is-complete", index < currentIndex);
    });
    progress.querySelectorAll(".launch-progress__seg").forEach((segment, index) => {
      segment.classList.toggle("is-complete", index < currentIndex);
      segment.classList.toggle("is-active", index === currentIndex);
    });
    const currentTitle = stages[currentIndex].querySelector(".launch-stage__title").textContent;
    document.getElementById("launchProgressLabel").textContent = `Stage ${currentIndex + 1} of ${stageIds.length} · ${currentTitle}`;
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-valuemin", "1");
    progress.setAttribute("aria-valuemax", String(stageIds.length));
    progress.setAttribute("aria-valuenow", String(currentIndex + 1));
    progress.setAttribute("aria-valuetext", `Stage ${currentIndex + 1} of ${stageIds.length}: ${currentTitle}`);
  }

  function stageTitle(id) {
    return stages[stageIndex(id)].querySelector(".launch-stage__title").textContent;
  }

  function scrollToStage(id) {
    const stage = stages[stageIndex(id)];
    const title = stage.querySelector(".launch-stage__title");
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
    stage.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }

  function showNotices() {
    const continueBtn = document.getElementById("launchContinue");
    const triageLink = document.getElementById("launchTriageLink");
    const awayFromStart = state.currentStage !== stageIds[0] || state.engaged.length > 0;
    if (!continueBtn) return;
    continueBtn.hidden = !awayFromStart;
    if (awayFromStart) continueBtn.textContent = `Continue at ${stageTitle(state.currentStage)}`;
    if (triageLink) triageLink.hidden = awayFromStart;
  }

  document.getElementById("launch-main").addEventListener("click", (event) => {
    const check = event.target.closest(".launch-resource__check");
    if (check) {
      const resource = check.closest(".launch-resource-wrap");
      const id = resource.dataset.resourceId;
      if (state.engaged.includes(id)) state.engaged = state.engaged.filter((value) => value !== id);
      else { state.engaged.push(id); track("Curriculum Resource Engaged", { resource: id, via: "toggle" }); }
      save(); render(); return;
    }
    const link = event.target.closest(".launch-resource");
    if (link) {
      const resource = link.closest(".launch-resource-wrap");
      const id = resource.dataset.resourceId;
      const sameTab = link.target !== "_blank";
      track("Curriculum Resource Open", { resource: id }, { beacon: sameTab });
      if (!state.engaged.includes(id)) {
        state.engaged.push(id); save();
        track("Curriculum Resource Engaged", { resource: id, via: "open" }, { beacon: sameTab });
        render();
      }
      return;
    }
    const advance = event.target.closest(".launch-advance");
    if (advance && !advance.disabled && advance.dataset.advanceFrom === state.currentStage) {
      const from = state.currentStage;
      state.currentStage = stageIds[stageIndex(from) + 1];
      save(); render(); track("Curriculum Advance", { from, to: state.currentStage });
      const nextStage = stages[stageIndex(state.currentStage)];
      const title = nextStage.querySelector(".launch-stage__title");
      title.tabIndex = -1; title.focus({ preventScroll: true });
      nextStage.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  });

  rail.addEventListener("click", (event) => {
    const link = event.target.closest("[data-rail-stage]");
    if (link && link.dataset.railStage !== state.currentStage) track("Curriculum Peek", { stage: link.dataset.railStage });
  });
  document.getElementById("launchContinue")?.addEventListener("click", () => {
    track("Curriculum Peek", { stage: state.currentStage, via: "continue" });
    scrollToStage(state.currentStage);
  });

  const bookmarkBtn = document.getElementById("launchBookmark");
  const bookmarkLabel = document.getElementById("launchBookmarkLabel");
  if (bookmarkBtn && bookmarkLabel) {
    const restLabel = bookmarkLabel.textContent;
    const mac = /Mac|iPhone|iPad/i.test(navigator.userAgent);
    const hint = mac ? "Press ⌘D to save" : "Press Ctrl+D to save";
    let hintTimer = 0;
    bookmarkBtn.addEventListener("click", async () => {
      const touch = navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches;
      if (touch && typeof navigator.share === "function") {
        try {
          await navigator.share({ title: document.title, url: location.href });
          return;
        } catch (error) {
          if (error && error.name === "AbortError") return;
        }
      }
      bookmarkLabel.textContent = hint;
      clearTimeout(hintTimer);
      hintTimer = window.setTimeout(() => { bookmarkLabel.textContent = restLabel; }, 2500);
    });
  }

  document.documentElement.classList.add("launch-js");
  showNotices();
  render();

  const hashToStage = {
    "#pre-flight": "preflight", "#stage-preflight": "preflight", "#spot": "spot", "#stage-spot": "spot",
    "#hook-up": "ready", "#stage-ready": "ready", "#tension": "tension", "#stage-tension": "tension",
    "#launch-stage": "launch", "#stage-launch": "launch",
  };
  const deepLinked = hashToStage[location.hash];
  if (deepLinked && deepLinked !== state.currentStage) track("Curriculum Peek", { stage: deepLinked, via: "hash" });
}

init();
