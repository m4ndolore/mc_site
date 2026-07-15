// js/curriculum.js — progressive enhancement over the build-time-injected
// curriculum DOM. State in localStorage; metrics via Plausible.
//
// HTML contract: see curriculum.html for the `.cur-*` markup this module
// binds to. Each resource is:
//   <div class="cur-resource" data-resource-id data-stage-id>
//     <button class="cur-resource__check" aria-pressed>
//     <a class="cur-resource__link" href>

const STORAGE_KEY = "mc.curriculum.v1";
const TRIAGE_KEY = "mc-founder-path-state-v1";
const ONBOARDING_KEY = "mc-onboarding-intent-v1"; // written by js/onboarding/MCOnboarding.jsx on /access
const ADVANCE_GATE = 2;

const TRIAGE_TO_STAGE = {
  "visionary-no-problem": "preflight",
  "curious": "preflight",
  "operator-with-problem": "spot",
  "builder-no-problem": "spot",
  "team-with-prototype": "ready",
  "scaling": "tension",
};

// /access step 1 readiness intents. Deeper placements are safe: the triage
// banner always offers "Start from the beginning instead".
const INTENT_TO_STAGE = {
  "exploring": "spot",
  "building": "ready",
  "scaling": "tension",
  "operating": "launch",
};

const TRIAGE_LABELS = {
  "visionary-no-problem": "a visionary without a problem yet",
  "curious": "exploring defense tech",
  "operator-with-problem": "an operator with a problem",
  "builder-no-problem": "a technical builder seeking a problem",
  "team-with-prototype": "a team with a working prototype",
  "scaling": "fundraising, scaling, or transitioning",
  "exploring": "exploring a problem",
  "building": "building or validating",
  "operating": "deployed and expanding",
};

function track(event, props, { beacon = false } = {}) {
  // sendBeacon survives same-tab navigation, which cancels the script's fetch.
  // Localhost guard mirrors the Plausible script's own dev exclusion.
  if (beacon && navigator.sendBeacon && !/^localhost$|^127\./.test(location.hostname)) {
    const payload = { n: event, u: location.href, d: "mergecombinator.com", r: document.referrer || null };
    if (props) payload.p = props;
    navigator.sendBeacon("https://plausible.io/api/event", JSON.stringify(payload));
    return;
  }
  const plausible = window.plausible;
  if (typeof plausible === "function") plausible(event, props ? { props } : undefined);
}

function init() {
  const stagesEl = document.getElementById("curStages");
  const stageEls = [...document.querySelectorAll(".cur-stage")];
  if (!stagesEl || stageEls.length === 0) {
    console.error("[curriculum] missing #curStages or .cur-stage elements — enhancement skipped");
    return;
  }

  const stageIds = stageEls.map((el) => el.dataset.stageId);
  const progressEl = document.getElementById("curProgress");
  progressEl.setAttribute("role", "progressbar");

  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (s && stageIds.includes(s.currentStage)) {
        return {
          currentStage: s.currentStage,
          engaged: Array.isArray(s.engaged) ? s.engaged : [],
          startedFrom: s.startedFrom || null,
          bannerDismissed: Boolean(s.bannerDismissed),
        };
      }
    } catch { /* ignore */ }
    return null;
  }

  function triageStage() {
    // Founder-path triage first (richer signal), then /access onboarding intent.
    try {
      const t = JSON.parse(localStorage.getItem(TRIAGE_KEY));
      if (t && t.stage && TRIAGE_TO_STAGE[t.stage]) {
        return { stage: TRIAGE_TO_STAGE[t.stage], answer: t.stage, source: "founder-path" };
      }
    } catch { /* ignore */ }
    try {
      const o = JSON.parse(localStorage.getItem(ONBOARDING_KEY));
      if (o && o.intent && INTENT_TO_STAGE[o.intent]) {
        return { stage: INTENT_TO_STAGE[o.intent], answer: o.intent, source: "onboarding" };
      }
    } catch { /* ignore */ }
    return null;
  }

  let state = loadState();
  const returning = Boolean(state);
  if (!state) {
    const mapped = triageStage();
    state = {
      currentStage: mapped ? mapped.stage : stageIds[0],
      engaged: [],
      startedFrom: mapped ? mapped.answer : null,
      bannerDismissed: false,
    };
    track("Curriculum Start", {
      stage: state.currentStage,
      fromTriage: String(Boolean(mapped)),
      source: mapped ? mapped.source : "direct",
    });
    save(); // persist immediately so Start fires once per user, not once per visit
  }
  let viewingStage = state.currentStage;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }

  const idx = (id) => stageIds.indexOf(id);
  const engagedInStage = (id) =>
    [...document.querySelectorAll(`.cur-resource[data-stage-id="${id}"]`)]
      .filter((el) => state.engaged.includes(el.dataset.resourceId)).length;

  function render() {
    const currentIdx = idx(state.currentStage);
    const viewIdx = idx(viewingStage);

    stageEls.forEach((el, i) => el.classList.toggle("is-open", i === viewIdx));

    document.querySelectorAll("#curProgress .fp-progress__seg").forEach((seg, i) => {
      seg.classList.toggle("is-complete", i < currentIdx);
      seg.classList.toggle("is-active", i === currentIdx);
    });
    const viewTitle = stageEls[viewIdx].querySelector(".cur-stage__title").textContent;
    const currentTitle = stageEls[currentIdx].querySelector(".cur-stage__title").textContent;
    document.getElementById("curProgressLabel").textContent =
      `Stage ${currentIdx + 1} of ${stageIds.length} · ${currentTitle}` +
      (viewIdx !== currentIdx ? ` (previewing ${viewTitle})` : "");
    progressEl.setAttribute("aria-valuemin", "1");
    progressEl.setAttribute("aria-valuemax", String(stageIds.length));
    progressEl.setAttribute("aria-valuenow", String(currentIdx + 1));
    progressEl.setAttribute("aria-valuetext", `Stage ${currentIdx + 1} of ${stageIds.length}: ${currentTitle}`);

    document.querySelectorAll(".cur-rail__link").forEach((link) => {
      const i = idx(link.dataset.railStage);
      link.classList.toggle("is-complete", i < currentIdx);
      link.classList.toggle("is-current", i === currentIdx);
      link.classList.toggle("is-upcoming", i > currentIdx);
    });

    document.querySelectorAll(".cur-resource").forEach((el) => {
      const engaged = state.engaged.includes(el.dataset.resourceId);
      el.classList.toggle("is-engaged", engaged);
      const check = el.querySelector(".cur-resource__check");
      if (check) check.setAttribute("aria-pressed", String(engaged));
    });

    stageEls.forEach((el, i) => {
      const id = el.dataset.stageId;
      const n = engagedInStage(id);
      const total = el.querySelectorAll(".cur-resource").length;
      const countEl = el.querySelector(".cur-stage__count");
      const btn = el.querySelector(".cur-advance");
      countEl.textContent = `${n} of ${total} explored`;
      const isCurrent = i === currentIdx;
      const isLast = i === stageIds.length - 1;
      btn.hidden = !isCurrent || isLast;
      if (isCurrent && !isLast) {
        const nextTitle = stageEls[i + 1].querySelector(".cur-stage__title").textContent;
        const unlocked = n >= ADVANCE_GATE;
        btn.disabled = !unlocked;
        btn.textContent = unlocked
          ? `Advance to ${nextTitle} →`
          : `Explore ${ADVANCE_GATE - n} more to advance`;
      }
      if (isCurrent && isLast) {
        countEl.textContent += " · Final stage";
      }
    });

    const peeking = viewIdx !== currentIdx;
    const strip = document.getElementById("curPeekStrip");
    strip.hidden = !peeking;
    if (peeking) {
      document.getElementById("curPeekText").textContent = `Your current stage is ${currentTitle}.`;
    }
  }

  function showBanner() {
    if (state.bannerDismissed || returning || !state.startedFrom) return;
    if (state.currentStage === stageIds[0]) return;
    const banner = document.getElementById("curTriageBanner");
    const stageTitle = stageEls[idx(state.currentStage)].querySelector(".cur-stage__title").textContent;
    document.getElementById("curTriageBannerText").textContent =
      `You're ${TRIAGE_LABELS[state.startedFrom] || "past the basics"} — we've started you at ${stageTitle}.`;
    banner.hidden = false;
  }

  function showResumeStrip() {
    if (!returning) return;
    const allIds = [...document.querySelectorAll(".cur-resource")].map((el) => el.dataset.resourceId);
    const explored = state.engaged.filter((id) => allIds.includes(id)).length;
    if (explored === 0 && state.currentStage === stageIds[0]) return;
    const stageTitle = stageEls[idx(state.currentStage)].querySelector(".cur-stage__title").textContent;
    document.getElementById("curResumeText").textContent =
      `Picking up at Stage ${idx(state.currentStage) + 1}: ${stageTitle} — ${explored} of ${allIds.length} resources explored.`;
    document.getElementById("curResumeStrip").hidden = false;
  }

  stagesEl.addEventListener("click", (e) => {
    const check = e.target.closest(".cur-resource__check");
    if (check) {
      const resource = check.closest(".cur-resource");
      const id = resource.dataset.resourceId;
      if (state.engaged.includes(id)) {
        state.engaged = state.engaged.filter((r) => r !== id);
      } else {
        state.engaged.push(id);
        track("Curriculum Resource Engaged", { resource: id, via: "toggle" });
      }
      save();
      render();
      return;
    }

    const link = e.target.closest(".cur-resource__link");
    if (link) {
      const resource = link.closest(".cur-resource");
      const id = resource.dataset.resourceId;
      const sameTab = link.target !== "_blank";
      track("Curriculum Resource Open", { resource: id }, { beacon: sameTab });
      if (!state.engaged.includes(id)) {
        state.engaged.push(id);
        track("Curriculum Resource Engaged", { resource: id, via: "open" }, { beacon: sameTab });
      }
      save();
      render();
      return; // navigation proceeds naturally (new tab for external links)
    }

    const adv = e.target.closest(".cur-advance");
    if (adv && !adv.disabled) {
      // Defense in depth: only the CURRENT stage's button may advance
      // (a stale button on a peeked stage must not move the real state).
      if (adv.dataset.advanceFrom !== state.currentStage) return;
      const from = state.currentStage;
      const next = stageIds[idx(from) + 1];
      state.currentStage = next;
      viewingStage = next;
      track("Curriculum Advance", { from, to: next });
      save();
      render();
      const title = stageEls[idx(next)].querySelector(".cur-stage__title");
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
      const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      document.getElementById("cur-main").scrollIntoView({ behavior });
    }
  });

  document.getElementById("curRail").addEventListener("click", (e) => {
    const link = e.target.closest(".cur-rail__link");
    if (!link) return;
    e.preventDefault();
    viewingStage = link.dataset.railStage;
    if (viewingStage !== state.currentStage) track("Curriculum Peek", { stage: viewingStage });
    render();
  });

  document.getElementById("curPeekReturn").addEventListener("click", () => {
    viewingStage = state.currentStage;
    render();
  });

  document.getElementById("curBannerDismiss").addEventListener("click", () => {
    state.bannerDismissed = true;
    save();
    document.getElementById("curTriageBanner").hidden = true;
  });

  document.getElementById("curStartOver").addEventListener("click", () => {
    state.currentStage = stageIds[0];
    state.bannerDismissed = true;
    viewingStage = stageIds[0];
    save();
    render();
    document.getElementById("curTriageBanner").hidden = true;
  });

  stagesEl.classList.add("js-enhanced");
  showBanner();
  showResumeStrip();
  render();
}

init();
