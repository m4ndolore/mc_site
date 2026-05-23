// js/founder-path.js — Founder Path triage app
// Vanilla ES module. No framework. Reads/writes DOM directly, persists to
// localStorage, emits Plausible events for the funnel.
//
// HTML contract: see founder-path.html for the `.fp-*` and `signals-sidebar`
// markup this module binds to.

const STORAGE_KEY = "mc-founder-path-state-v1";
const SESSION_KEY = "mc-founder-path-session-id";
const API_ENDPOINT = "https://api.mergecombinator.com/founder-path/triage";

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
        ? "fp-" + crypto.randomUUID()
        : "fp-" + Math.random().toString(36).slice(2) + "-" + Date.now();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "fp-anon-" + Date.now();
  }
}

// ─── state ──────────────────────────────────────────────────────────────────
const state = {
  step: 1,
  stage: null,
  brings: new Set(),
  constraints: new Set(),
  company: null,
  contact: { name: "", email: "", context: "" },
  completedAt: null,
};

function persist() {
  try {
    const snap = {
      ...state,
      brings: [...state.brings],
      constraints: [...state.constraints],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch { /* ignore */ }
}

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s) return false;
    state.step = normalizeStep(s.step);
    state.stage = s.stage || null;
    state.brings = new Set(s.brings || []);
    state.constraints = new Set(s.constraints || []);
    state.company = s.company || null;
    state.contact = s.contact || state.contact;
    state.completedAt = s.completedAt || null;
    return hasSavedProgress();
  } catch { /* ignore */ }
  return false;
}

function normalizeStep(step) {
  if (step === "result") return "result";
  const n = Number(step);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 1;
}

function hasSavedProgress() {
  return Boolean(
    state.stage ||
    state.brings.size ||
    state.constraints.size ||
    state.company ||
    state.contact.name ||
    state.contact.email ||
    state.contact.context ||
    state.completedAt
  );
}

// ─── analytics ──────────────────────────────────────────────────────────────
function track(event, props = {}) {
  if (typeof window === "undefined") return;
  const plausible = window.plausible;
  if (typeof plausible !== "function") return;
  plausible(event, { props });
}

// ─── ui binding ─────────────────────────────────────────────────────────────
const STEP_LABELS = {
  1: "Step 1 of 5 · Stage",
  2: "Step 2 of 5 · What you bring",
  3: "Step 3 of 5 · The constraint",
  4: "Step 4 of 5 · Company shape",
  5: "Step 5 of 5 · Send it to you",
  result: "Triage complete",
};

let stepEls, progressSegs, progressLabel, stepNavLinks;

function showStep(s) {
  state.step = s;
  persist();
  stepEls.forEach((el) => el.classList.toggle("is-active", el.dataset.step === String(s)));
  if (s === "result") {
    progressSegs.forEach((seg) => seg.classList.add("is-active"));
  } else {
    progressSegs.forEach((seg, i) => seg.classList.toggle("is-active", i < s));
  }
  progressLabel.textContent = STEP_LABELS[s] || "";

  // sync sidebar
  if (stepNavLinks) {
    stepNavLinks.forEach((a) => {
      const t = a.dataset.stepTarget;
      a.classList.toggle("signals-sidebar__link--active", t === String(s));
    });
  }

  track("founder_path_step_view", { step: String(s) });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── recommendation engine ──────────────────────────────────────────────────
const STAGE_META = {
  "visionary-no-problem": {
    label: "Pre-problem visionary",
    headline: "You have conviction. Your job for the next 90 days is finding the wound.",
    lede: "The fastest path forward is two things in parallel: get in a room with operators (so a real problem can find you), and pair with a technical co-founder (so the moment you spot one, you can move).",
  },
  "operator-with-problem": {
    label: "Operator-founder",
    headline: "You own the problem. The next move is converting that into a team and a wedge.",
    lede: "Operators with a real problem are MC's favorite shape. Your unlocks are technical velocity (the Missionized Tech Residency was built for exactly this), capital, and a translation layer to the acquisition system.",
  },
  "builder-no-problem": {
    label: "Builder seeking problem",
    headline: "You can ship. The question is what — and for whom.",
    lede: "Don't pick a problem from a deck. Pair with an operator who lives one. We'll help you meet them, fast.",
  },
  "team-with-prototype": {
    label: "Early product",
    headline: "You have something. Now harden it against real operators and a real buyer.",
    lede: "The Combine and Defense Builders are the two highest-leverage things you can do this quarter.",
  },
  "scaling": {
    label: "Crossing the valley",
    headline: "Capital, contract vehicles, and talent density — in that order.",
    lede: "MC's role here shifts from co-founder to capability layer. We point you at the right contract vehicle, the right intro, and the right hire.",
  },
  "curious": {
    label: "Exploring",
    headline: "Good. Curiosity precedes conviction.",
    lede: "Read three things, talk to one operator, then decide. We'll show you which three.",
  },
};

const UNLOCK_LIBRARY = {
  "problem": { title: "A problem worth solving", why: "Most failed defense-tech didn't fail at building — it failed at problem selection. Get this right or nothing else matters." },
  "problem-owner": { title: "A named problem owner", why: "A named operator with skin in the game beats a survey of 50. One person who picks up the phone." },
  "tech-cofounder": { title: "A technical co-founder", why: "Vision needs velocity. A great technical co-founder compresses 18 months of confused wandering into 90 days of shipping." },
  "domain-cofounder": { title: "A domain / non-technical co-founder", why: "Builders need someone who lived the problem, owns the customer relationship, and translates ops to engineering." },
  "capital": { title: "Capital / runway", why: "Defense sales cycles are long. You need enough runway to be patient and aggressive at the same time." },
  "operator-access": { title: "Operator access", why: "Without operators in the room, you'll build the wrong thing fast. Repeated, structured operator contact is the moat." },
  "acquisition": { title: "Acquisition fluency", why: "DoD doesn't buy software the way commercial does. Knowing OTAs, SBIR/STTR, ATO, and color-of-money is non-optional." },
  "cohort": { title: "Cohort / momentum", why: "Founders move faster around other founders moving fast. Solo founders compound stress; cohort founders compound learning." },
  "validation": { title: "Validation that this is real", why: "Before you raise, hire, or quit your job — get five operators to say 'I'd use that today' in their own words." },
  "contract-vehicle": { title: "A contract vehicle / first dollar", why: "First defense dollar de-risks the next ten. SBIR Phase I, OTA, or a customer with discretionary funds." },
};

const REC_INTERNAL = {
  combine: { tag: "MC · The Combine", title: "The Combine", desc: "Validate funded DoD tech directly with warfighters — before you build the wrong thing at scale.", href: "/programs/the-combine" },
  builders: { tag: "MC · Defense Builders", title: "Defense Builders", desc: "Premium support for founder matching, opportunity briefs, office hours, and direct help navigating the defense market.", href: "/access?context=builders" },
  wingman: { tag: "MC · Wingman", title: "Wingman", desc: "Turn your mobile device into a mission asset. Useful when your wedge needs an edge endpoint.", href: "/wingman" },
  missionized: { tag: "MC · Residency", title: "Missionized Tech Residency", desc: "Embedded technical residents who pair with operator-founders to ship the first real prototype. In partnership with the U.S. Army and Defense Acquisition University.", href: "/programs/residency" },
  rme: { tag: "MC · RME desk", title: "RME acquisition pros", desc: "Direct intros to acquisition professionals who can decode color-of-money, contract vehicles, and the ATO maze.", href: "/access?source=founder-path&intent=rme" },
  triage: { tag: "MC · 1-on-1", title: "30-min triage call with a partner", desc: "If the report below is right but you want to argue it out with a human, book the call.", href: "https://calendar.app.google/caYkEhTngEyUEgDn7" },
  cohort: { tag: "MC · The Combine cohort", title: "Combine cohort program", desc: "Time-bounded cohort that pairs founders with operators and acquisition pros for 8 weeks.", href: "/combine/cohort25-1" },
  opportunities: { tag: "MC · Opportunities", title: "Opportunities radar", desc: "SBIR / STTR / OTA listings already filtered for what's actually winnable.", href: "/opportunities" },
};

// External recs are intentionally rare. The studio's job is to build the
// equivalent content on-platform — see REC_CONTENT for the on-site
// replacements (customer discovery, problem framing, co-founder dynamics,
// acquisition primer, mission model canvas). YC is currently the only
// external path we surface, and only when stage + company shape genuinely fit.
const REC_EXTERNAL = {
  yc: { tag: "External · YC", title: "Y Combinator", desc: "We'll honestly say when YC is the right answer — typically a CEO + technical co-founder pair without strong vertical anchoring. If your wedge is defense-first with operator co-design, MC is the better path.", href: "https://www.ycombinator.com/apply" },
};

// On-platform content rec engine. Every item here lives at
// mergecombinator.com/knowledge/* and keeps the user on site. The Steve Blank
// canon (customer discovery, mission model, problem-first framing) lives in
// here as MC-native pieces rather than as outbound links.
const REC_CONTENT = {
  knowledge: { tag: "MC · Knowledge", title: "MC knowledge base", desc: "Curated reads on problem selection, acquisition, and operator engagement.", href: "/knowledge" },
  faq: { tag: "MC · FAQ", title: "How does Merge Combinator work?", desc: "What we do, when we engage, what we ask in return.", href: "/about#faq" },
  signals: { tag: "MC · Signals", title: "Signals", desc: "Field notes from the studio — recent posts on operator-led design, NDAA, and acquisition.", href: "/signals" },
  about: { tag: "MC · About", title: "Why we built Merge Combinator", desc: "Operator + technical co-founders, Indo-Pacific first.", href: "/about" },
  status: { tag: "MC · Status", title: "What we're building this quarter", desc: "Live status of MC programs, cohorts, and openings.", href: "/status" },
  "customer-discovery": { tag: "MC · Knowledge", title: "Customer Discovery for Defense Founders", desc: "Customer-development for the operator world: who to talk to, what to ask, and how to read the answers. The Steve Blank canon, applied to mission tech.", href: "/knowledge/go-to-market" },
  "problem-frame": { tag: "MC · Knowledge", title: "Finding the Operator Wound", desc: "How to move from \"I want to build defense tech\" to \"this specific operator, this specific failure mode, this specific cost.\"", href: "/knowledge/defense-venture-studio" },
  "cofounder-playbook": { tag: "MC · Knowledge", title: "Co-Founder Dynamics for Mission Tech", desc: "What makes a defense-tech co-founder pairing actually work — and the early signals that it won't.", href: "/knowledge/defense-venture-studio" },
  "acquisition-primer": { tag: "MC · Knowledge", title: "How DoD Actually Buys", desc: "Plain-English primer on color-of-money, OTAs, SBIR/STTR, and the contract vehicles that matter.", href: "/knowledge/acquisition" },
  "mission-model": { tag: "MC · Knowledge", title: "The Mission Model Canvas", desc: "Business Model Canvas, retooled for mission-driven ventures. Hosted as an interactive worksheet.", href: "/knowledge" },
};

function rankUnlocks() {
  const picked = [...state.constraints];
  const stage = state.stage;
  const base = picked.slice(0, 3);

  const defaults = {
    "visionary-no-problem": ["problem", "tech-cofounder", "operator-access"],
    "operator-with-problem": ["tech-cofounder", "capital", "acquisition"],
    "builder-no-problem": ["problem-owner", "operator-access", "domain-cofounder"],
    "team-with-prototype": ["validation", "contract-vehicle", "capital"],
    "scaling": ["capital", "contract-vehicle", "acquisition"],
    "curious": ["problem", "operator-access", "validation"],
  };

  const out = [];
  for (const k of base) if (UNLOCK_LIBRARY[k] && !out.includes(k)) out.push(k);
  for (const k of (defaults[stage] || [])) {
    if (out.length >= 3) break;
    if (UNLOCK_LIBRARY[k] && !out.includes(k)) out.push(k);
  }
  return out.slice(0, 3);
}

function pickInternal() {
  const stage = state.stage;
  const c = state.constraints;
  const recs = new Set();

  if (stage === "visionary-no-problem") { recs.add("builders"); recs.add("missionized"); recs.add("triage"); }
  if (stage === "operator-with-problem") { recs.add("missionized"); recs.add("builders"); recs.add("rme"); }
  if (stage === "builder-no-problem") { recs.add("builders"); recs.add("combine"); recs.add("opportunities"); }
  if (stage === "team-with-prototype") { recs.add("combine"); recs.add("rme"); recs.add("cohort"); }
  if (stage === "scaling") { recs.add("rme"); recs.add("opportunities"); recs.add("triage"); }
  if (stage === "curious") { recs.add("triage"); recs.add("combine"); recs.add("opportunities"); }

  if (c.has("tech-cofounder") || c.has("domain-cofounder")) { recs.add("builders"); recs.add("missionized"); }
  if (c.has("acquisition") || c.has("contract-vehicle")) { recs.add("rme"); recs.add("opportunities"); }
  if (c.has("operator-access") || c.has("problem-owner")) { recs.add("combine"); recs.add("missionized"); }
  if (c.has("validation")) { recs.add("combine"); }
  if (c.has("cohort")) { recs.add("cohort"); }

  return [...recs].slice(0, 4);
}

function pickExternal() {
  const stage = state.stage;
  const company = state.company;
  const recs = new Set();

  if ((stage === "visionary-no-problem" || stage === "builder-no-problem") &&
      (company === "dual-use" || company === "commercial-first" || company === "unsure")) {
    recs.add("yc");
  }
  return [...recs].slice(0, 2);
}

function pickContent() {
  const stage = state.stage;
  const c = state.constraints;
  const recs = [];

  if (stage === "visionary-no-problem" || stage === "curious") recs.push("problem-frame", "customer-discovery");
  if (stage === "operator-with-problem") recs.push("cofounder-playbook", "mission-model");
  if (stage === "builder-no-problem") recs.push("problem-frame", "customer-discovery");
  if (stage === "team-with-prototype") recs.push("customer-discovery", "acquisition-primer");
  if (stage === "scaling") recs.push("acquisition-primer", "mission-model");

  if (c.has("tech-cofounder") || c.has("domain-cofounder")) recs.push("cofounder-playbook");
  if (c.has("acquisition") || c.has("contract-vehicle")) recs.push("acquisition-primer");
  if (c.has("problem") || c.has("problem-owner") || c.has("validation")) recs.push("customer-discovery");
  if (c.has("operator-access")) recs.push("problem-frame");

  recs.push("knowledge", "faq");

  const out = [];
  for (const k of recs) if (!out.includes(k)) out.push(k);
  return out.slice(0, 4);
}

// ─── render ─────────────────────────────────────────────────────────────────
function renderRecs(targetId, list, lib, modifier = "") {
  const target = document.getElementById(targetId);
  target.innerHTML = "";
  list.forEach((id) => {
    const r = lib[id];
    if (!r) return;
    const a = document.createElement("a");
    a.className = "fp-rec" + (modifier ? " fp-rec--" + modifier : "");
    a.href = r.href;
    if (r.href.startsWith("http")) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    a.innerHTML = `
      <span class="fp-rec__tag">${r.tag}</span>
      <span class="fp-rec__title">${r.title}</span>
      <span class="fp-rec__desc">${r.desc}</span>
      <span class="fp-rec__cta">Open</span>`;
    target.appendChild(a);
  });
}

function renderUnlocks(list) {
  const target = document.getElementById("fpUnlocks");
  target.innerHTML = "";
  list.forEach((id, i) => {
    const u = UNLOCK_LIBRARY[id];
    if (!u) return;
    const div = document.createElement("div");
    div.className = "fp-unlock";
    div.innerHTML = `
      <span class="fp-unlock__rank">${i + 1}</span>
      <div>
        <div class="fp-unlock__title">${u.title}</div>
        <div class="fp-unlock__why">${u.why}</div>
      </div>`;
    target.appendChild(div);
  });
}

function buildResult() {
  const meta = STAGE_META[state.stage] || STAGE_META["curious"];
  document.getElementById("fpResultStage").textContent = meta.label;
  document.getElementById("fpResultHeadline").textContent = meta.headline;
  document.getElementById("fpResultLede").textContent = meta.lede;

  renderUnlocks(rankUnlocks());
  renderRecs("fpRecsInternal", pickInternal(), REC_INTERNAL, "internal");

  const externalList = pickExternal();
  renderRecs("fpRecsExternal", externalList, REC_EXTERNAL, "external");
  document.getElementById("fpRecsExternalTitle").style.display = externalList.length ? "flex" : "none";

  renderRecs("fpRecsContent", pickContent(), REC_CONTENT, "content");

  // Book-call → Google Calendar appointment slots (custom domain).
  // Google's appointment URL supports limited prefill — we pass name/email
  // when available so the booker doesn't retype them.
  const bookUrl = new URL("https://calendar.app.google/caYkEhTngEyUEgDn7");
  if (state.contact.name)  bookUrl.searchParams.set("name", state.contact.name);
  if (state.contact.email) bookUrl.searchParams.set("email", state.contact.email);
  document.getElementById("fpBookCallBtn").href = bookUrl.toString();
}

// ─── API submission ─────────────────────────────────────────────────────────
async function submitToApi() {
  const payload = {
    schema_version: "founder_path_v1",
    sessionId: getSessionId(),
    source: "founder-path",
    stage: state.stage,
    brings: [...state.brings],
    constraints: [...state.constraints],
    company: state.company,
    unlocks: rankUnlocks(),
    internalRecs: pickInternal(),
    externalRecs: pickExternal(),
    contentRecs: pickContent(),
    name: state.contact.name || null,
    email: state.contact.email || null,
    context: state.contact.context || null,
  };

  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    mode: "cors",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

function copyReport() {
  const meta = STAGE_META[state.stage] || {};
  const unlocks = rankUnlocks().map((id, i) => `  ${i + 1}. ${UNLOCK_LIBRARY[id]?.title} — ${UNLOCK_LIBRARY[id]?.why}`).join("\n");
  const internal = pickInternal().map((id) => `  • ${REC_INTERNAL[id]?.title} — ${REC_INTERNAL[id]?.href}`).join("\n");
  const external = pickExternal().map((id) => `  • ${REC_EXTERNAL[id]?.title} — ${REC_EXTERNAL[id]?.href}`).join("\n");
  const text = [
    `MERGE COMBINATOR · FOUNDER PATH TRIAGE`,
    `Stage: ${meta.label}`,
    `Headline: ${meta.headline}`,
    ``,
    `TOP UNLOCKS`,
    unlocks,
    ``,
    `INSIDE MC`,
    internal,
    ``,
    `EXTERNAL`,
    external || "  (none — MC is the right answer)",
  ].join("\n");
  navigator.clipboard?.writeText(text).then(
    () => { console.info("[founder-path] report copied"); window.alert("Triage report copied."); },
    () => { console.log(text); window.alert("Couldn't copy — printed to console."); }
  );
}

// ─── boot ───────────────────────────────────────────────────────────────────
function boot() {
  stepEls = document.querySelectorAll(".fp-step");
  progressSegs = document.querySelectorAll(".fp-progress__seg");
  progressLabel = document.getElementById("fpProgressLabel");
  stepNavLinks = document.querySelectorAll("#fpStepNav [data-step-target]");
  const resumeNotice = document.getElementById("fpResumeNotice");

  // Single-select option groups
  document.querySelectorAll(".fp-options").forEach((group) => {
    const key = group.dataset.key;
    group.querySelectorAll(".fp-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        group.querySelectorAll(".fp-option").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        state[key] = btn.dataset.value;
        const next = group.closest(".fp-step").querySelector('[data-action="next"]');
        if (next) next.disabled = false;
        persist();
        track("founder_path_select", { key, value: btn.dataset.value });
      });
    });
  });

  // Multi-select chip groups
  document.querySelectorAll(".fp-chips").forEach((group) => {
    const key = group.dataset.key;
    const max = group.dataset.max ? parseInt(group.dataset.max, 10) : Infinity;
    group.querySelectorAll(".fp-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const set = state[key];
        if (set.has(btn.dataset.value)) {
          set.delete(btn.dataset.value);
          btn.classList.remove("is-selected");
        } else {
          if (set.size >= max) return;
          set.add(btn.dataset.value);
          btn.classList.add("is-selected");
        }
        if (key === "constraints") {
          const hint = document.getElementById("fpConstraintsHint");
          const left = max - set.size;
          hint.textContent = left > 0 ? `Pick up to ${max} · ${left} left` : `Maxed at ${max}`;
        }
        persist();
        track("founder_path_chip_toggle", { key, value: btn.dataset.value });
      });
    });
  });

  // Step nav (sidebar)
  stepNavLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = parseInt(a.dataset.stepTarget, 10);
      // only allow navigating to steps we've passed or the current step
      if (target <= state.step || target === state.step + 1) {
        showStep(target);
      }
    });
  });

  // Form nav buttons (next / back / submit / restart / copy)
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "next") {
        if (state.step < 5) showStep(state.step + 1);
      } else if (action === "back") {
        if (state.step > 1) showStep(state.step - 1);
      } else if (action === "submit") {
        const email = document.getElementById("fp-email").value.trim();
        const err = document.getElementById("fpEmailError");
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          err.style.display = "block";
          return;
        }
        err.style.display = "none";
        state.contact.name = document.getElementById("fp-name").value.trim();
        state.contact.email = email;
        state.contact.context = document.getElementById("fp-context").value.trim();
        state.completedAt = new Date().toISOString();
        persist();
        buildResult();
        showStep("result");
        track("founder_path_submit", {
          stage: state.stage || "unknown",
          company: state.company || "unknown",
          has_email: state.contact.email ? "yes" : "no",
        });
        // Submit to API (best-effort — UI shows success regardless; API
        // failures are logged so the user never sees a flaky network).
        submitToApi().catch((e) => console.warn("[founder-path] submit failed:", e));
        if (state.contact.email) {
          document.getElementById("fpPostSubmit").style.display = "block";
        }
      } else if (action === "restart") {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      } else if (action === "copy") {
        copyReport();
      }
    });
  });

  // Rehydrate from any persisted state
  const restored = restore();

  if (state.stage) {
    const opt = document.querySelector(`[data-key="stage"] .fp-option[data-value="${state.stage}"]`);
    if (opt) {
      opt.classList.add("is-selected");
      const next = document.querySelector('.fp-step[data-step="1"] [data-action="next"]');
      if (next) next.disabled = false;
    }
  }
  state.brings.forEach((v) =>
    document.querySelector(`[data-key="brings"] .fp-chip[data-value="${v}"]`)?.classList.add("is-selected"));
  state.constraints.forEach((v) =>
    document.querySelector(`[data-key="constraints"] .fp-chip[data-value="${v}"]`)?.classList.add("is-selected"));
  if (state.company) {
    document.querySelector(`[data-key="company"] .fp-option[data-value="${state.company}"]`)?.classList.add("is-selected");
  }
  if (state.contact.name) document.getElementById("fp-name").value = state.contact.name;
  if (state.contact.email) document.getElementById("fp-email").value = state.contact.email;
  if (state.contact.context) document.getElementById("fp-context").value = state.contact.context;
  if (restored && resumeNotice) {
    resumeNotice.hidden = false;
  }
  if (state.step === "result") {
    buildResult();
  }
  showStep(state.step || 1);

  track("founder_path_entry", { path: window.location.pathname });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
