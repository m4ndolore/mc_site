import { useState, useEffect, useReducer, useRef, useCallback } from "preact/hooks";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const API_ENDPOINT = "https://api.mergecombinator.com/access/provision";
const LEGACY_ENDPOINT = "https://api.sigmablox.com/api/access-request";
const STORAGE_KEY = "mc-onboarding-state";
const COMPLETED_KEY = "mc-onboarding-completed";
const TURNSTILE_SITE_KEY = document.body?.dataset?.turnstileSiteKey || "";
const ANALYTICS_SCHEMA_VERSION = "access_ontology_v1";
const ACCESS_SESSION_KEY = "mc-access-session-id";
const ACCESS_JOURNEY_KEY = "mc-access-journey-id";
const CONTEXT_RETURN_TO = {
  guild: "https://guild.mergecombinator.com/",
  app: "https://guild.mergecombinator.com/",
  builders: "/builders",
  combine: "/combine",
  wingman: "/wingman",
};

let analyticsContext = {
  schema_version: ANALYTICS_SCHEMA_VERSION,
  session_id: "unknown",
  journey_id: "unknown",
  context: "none",
  source: "none",
  referrerHost: null,
  return_bucket: "unknown",
  opportunity_id: null,
  opportunity_code: null,
  opportunity_title: null,
};

function generateId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function getOrCreateSessionStorageId(key, prefix) {
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const next = generateId(prefix);
    sessionStorage.setItem(key, next);
    return next;
  } catch {
    return generateId(prefix);
  }
}

function setAnalyticsContext(next) {
  analyticsContext = {
    ...analyticsContext,
    ...next,
    schema_version: ANALYTICS_SCHEMA_VERSION,
  };
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function safePlausible(eventName, props) {
  if (typeof window === "undefined") return;
  const plausible = window.plausible;
  if (typeof plausible !== "function") return;
  plausible(eventName, { props });
}

function sendAccessEventToApi(event, data) {
  if (typeof window === "undefined") return;
  const envelope = {
    ...analyticsContext,
    ...data,
    event_ts: new Date().toISOString(),
  };
  const payload = {
    event,
    data: envelope,
    page: window.location.pathname,
  };

  // Fire-and-forget; never block UX on telemetry delivery.
  fetch("https://api.mergecombinator.com/analytics/access/events", {
    method: "POST",
    mode: "cors",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

function toReturnBucket(returnTo) {
  if (!returnTo) return "unknown";
  const value = returnTo.toLowerCase();
  if (value.includes("guild.mergecombinator.com")) return "guild";
  if (value.startsWith("/combine")) return "combine";
  if (value.startsWith("/builders")) return "builders";
  if (value.startsWith("/wingman")) return "wingman";
  if (value.startsWith("/")) return "mc-page";
  return "other";
}

function forwardToPlausible(event, data) {
  if (event === "access_entry") {
    safePlausible("access_entry", {
      context: data.context || "none",
      source: data.source || "none",
      referrer_host: data.referrerHost || "none",
      return_bucket: toReturnBucket(data.resolvedReturnTo),
    });
    return;
  }

  if (event === "step_view") {
    safePlausible("access_step_view", {
      step: String(data.step),
    });
    return;
  }

  if (event === "journey_select") {
    safePlausible("access_journey_select", {
      stage: data.stage || "unknown",
    });
    return;
  }

  if (event === "submit_success") {
    safePlausible("access_submit_success", {
      verified: data.verified ? "yes" : "no",
      legacy: data.legacy ? "yes" : "no",
      role: data.role || "unknown",
    });
    return;
  }

  if (event === "products_done") {
    safePlausible("access_products_done", {
      count: Array.isArray(data.products) ? String(data.products.length) : "0",
    });
  }
}

function forwardToApi(event, data) {
  if (
    event === "access_entry" ||
    event === "access_step_view" ||
    event === "access_journey_select" ||
    event === "access_submit_success" ||
    event === "access_products_done"
  ) {
    sendAccessEventToApi(event, data);
  }
}

function track(event, data = {}) {
  const detail = { event, timestamp: Date.now(), ...data };
  window.dispatchEvent(new CustomEvent("mc:onboarding", { detail }));
  const enriched = { ...analyticsContext, ...data };
  forwardToPlausible(event, enriched);
  forwardToApi(event, enriched);
  if (import.meta.env.DEV) console.debug("[onboarding]", event, data);
}

function buildLoginHref(returnTo) {
  return `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

function getReturnToFromContext(searchParams) {
  const explicit = searchParams.get("returnTo") || searchParams.get("return_to");
  if (explicit) return explicit;
  const context = (searchParams.get("context") || searchParams.get("ref") || "").toLowerCase();
  return CONTEXT_RETURN_TO[context] || null;
}

function getReturnToFromReferrer() {
  try {
    if (!document.referrer) return null;
    const ref = new URL(document.referrer);
    if (ref.hostname === "sigmablox.com" || ref.hostname === "www.sigmablox.com") return "/combine";
    if (ref.hostname === "guild.mergecombinator.com") return "https://guild.mergecombinator.com/";
    if (ref.hostname === "wingman.mergecombinator.com") return "/wingman";
    if (ref.hostname === "builders.mergecombinator.com") return "/builders";
    return null;
  } catch {
    return null;
  }
}

function resolveAccessReturnTo() {
  try {
    const params = new URLSearchParams(window.location.search);
    return getReturnToFromContext(params) || getReturnToFromReferrer() || "https://guild.mergecombinator.com/";
  } catch {
    return "https://guild.mergecombinator.com/";
  }
}

function getAccessEntryMeta() {
  try {
    const params = new URLSearchParams(window.location.search);
    const context = (params.get("context") || params.get("ref") || "").toLowerCase() || null;
    const source = (params.get("source") || "").toLowerCase() || null;
    let referrerHost = null;
    if (document.referrer) {
      try { referrerHost = new URL(document.referrer).hostname; } catch { referrerHost = null; }
    }
    return { context, source, referrerHost };
  } catch {
    return { context: null, source: null, referrerHost: null };
  }
}

function getOpportunityEntryContext() {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("opp_id") || null;
    const code = params.get("opp_code") || null;
    const title = params.get("opp_title") || null;
    if (!id && !code && !title) return null;
    return { id, code, title };
  } catch {
    return null;
  }
}

function getReferralContextFromReturnTo(returnTo) {
  if (!returnTo) return null;
  const value = returnTo.toLowerCase();
  if (value.includes("guild.mergecombinator.com")) return "guild";
  if (value.startsWith("/combine")) return "combine";
  if (value.startsWith("/builders")) return "builders";
  if (value.startsWith("/wingman")) return "wingman";
  return null;
}

function getWelcomeCopy(context) {
  if (context === "combine") {
    return {
      title: "Continue to The Combine.",
      subtitle: "You came from Sigmablox. Sign in to continue with Combine context on Merge Combinator.",
      cta: "Sign in to The Combine \u2192",
    };
  }
  if (context === "builders") {
    return {
      title: "Continue to Defense Builders.",
      subtitle: "Sign in to resume your Defense Builders workspace and matches.",
      cta: "Sign in to Defense Builders \u2192",
    };
  }
  if (context === "wingman") {
    return {
      title: "Continue to Wingman.",
      subtitle: "Sign in to access your Wingman workspace and saved context.",
      cta: "Sign in to Wingman \u2192",
    };
  }
  if (context === "guild") {
    return {
      title: "Continue to Guild.",
      subtitle: "Sign in to resume your Guild workspace and network.",
      cta: "Sign in to Guild \u2192",
    };
  }
  return {
    title: "Sign in to continue.",
    subtitle: "Looks like you've been here before. Sign in to access your sandbox, or start fresh if you're new.",
    cta: "Sign in with Email \u2192",
  };
}

// ─── HERO STATE MAP ───────────────────────────────────────────────────────────
const HERO = {
  default: {
    tag: "VENTURE STUDIO \u00B7 NATIONAL SECURITY",
    lines: ["Build what", "warfighters", "need."],
    accent: 2,
    body: "We co-found and build new ventures to solve urgent operational problems with a relentless focus on Indo-Pacific deterrence.",
    pulse: null,
  },
  "Problem Solving": {
    tag: "PROBLEM DISCOVERY",
    lines: ["The best", "problems aren't", "in the RFP."],
    accent: 1,
    body: "We embed with operators before requirements are written \u2014 surfacing the problems worth solving before anyone else sees them.",
    pulse: "Signal: active",
  },
  "Program Transition": {
    tag: "TECHNOLOGY TRANSITION",
    lines: ["The valley", "of death", "is real."],
    accent: 2,
    body: "Most defense tech dies between prototype and program of record. Our transition engineering model was built for exactly that gap.",
    pulse: "TRL 4 \u2192 7",
  },
  "Commercialization": {
    tag: "COMMERCIALIZATION",
    lines: ["From lab", "to market", "to mission."],
    accent: 2,
    body: "Turning defense innovation into sustainable businesses that serve the warfighter and scale beyond the prototype.",
    pulse: "Dual-use ready",
  },
  "Building": {
    tag: "CO-FOUNDING MODEL",
    lines: ["We don't", "advise.", "We co-build."],
    accent: 1,
    body: "We take on real risk alongside founders \u2014 bringing operator access, funding pathways, and a network that gets things done.",
    pulse: "Equity-aligned",
  },
  "Deploying Capability": {
    tag: "SPEED TO FIELDING",
    lines: ["Prototype", "to fielded", "capability."],
    accent: 2,
    body: "We know every shortcut through the acquisition process and when to use them. Speed is a strategic advantage.",
    pulse: "ATO accelerated",
  },
  "Mission Outcomes": {
    tag: "OUTCOMES OVER OUTPUTS",
    lines: ["Measured by", "what's used", "in the field."],
    accent: 1,
    body: "Not by what's funded. Not by what's built. By what actually makes the warfighter more effective under pressure.",
    pulse: "Ops tempo: high",
  },
  "National Security": {
    tag: "MISSION FIRST",
    lines: ["Does this", "make America", "harder to beat?"],
    accent: 2,
    body: "Every venture we build answers that question first. If the answer isn't obvious, we go back to the problem.",
    pulse: "U//FOUO",
  },
  "Allies & Partners": {
    tag: "COALITION BUILDING",
    lines: ["Deterrence", "is a", "team sport."],
    accent: 2,
    body: "We build for interoperability with Indo-Pacific partners who need to move fast and can't wait for traditional timelines.",
    pulse: "FVEY aligned",
  },
  multi_areas: {
    tag: "YOUR FOCUS AREAS",
    lines: ["Full lifecycle.", "Transition is", "systems engineering."],
    accent: 2,
    body: "From problem discovery to fielded capability \u2014 we operate across the entire arc of the mission.",
    pulse: null,
  },
  values_selected: {
    tag: "HOW MERGE COMBINATOR DELIVERS",
    lines: ["It takes more", "than just boots", "on the ground."],
    accent: 0,
    body: "Incentives drive innovation. Find the right people and put them in the right rooms. What is holding you back?",
    pulse: "Theater insights",
  },
  journey_step: {
    tag: "HOW WE WORK",
    lines: ["Privileged", "access.", "Mission Outcomes."],
    accent: 2,
    body: "Trust is our most valuable signal. We are partners that build with you, shape the process, and co-sign the outcome alongside you.",
    pulse: null,
  },
  "I have a problem to solve": {
    tag: "PROBLEM DISCOVERY",
    lines: ["Start with", "the right", "problem."],
    accent: 2,
    body: "Most failed defense tech didn't fail at building \u2014 it failed at problem selection. We put operators in the room before day one.",
    pulse: "Discovery mode",
  },
  "I have a concept to validate": {
    tag: "VALIDATION",
    lines: ["Validate fast.", "Build less.", "Miss nothing."],
    accent: 0,
    body: "The Combine puts your concept in front of real warfighters before a single production dollar is committed. Fail cheap, learn fast.",
    pulse: "Warfighter access",
  },
  "I'm building a prototype": {
    tag: "BUILD PHASE",
    lines: ["Builders", "find each", "other here."],
    accent: 1,
    body: "Defense Builders connects the people who see the problem with the people who can solve it \u2014 and gets them working in days.",
    pulse: "Prototype in 72hrs",
  },
  "I need to scale or transition": {
    tag: "TRANSITION ENGINEERING",
    lines: ["The valley", "of death", "ends here."],
    accent: 2,
    body: "We've navigated the transition gap more times than we can count. We know the pathways, the players, and the shortcuts that work.",
    pulse: "TRL 4 \u2192 7",
  },
  "I'm deployed, optimizing": {
    tag: "SUSTAINMENT & SCALE",
    lines: ["Fielded.", "Funded.", "Growing."],
    accent: 0,
    body: "Once you're deployed, the work isn't done \u2014 it's different. We help you hold ground, expand access, and compound your advantage.",
    pulse: "Program of record",
  },
  contact_step: {
    tag: "ALMOST INSIDE",
    lines: ["What's", "stopping", "you?"],
    accent: 2,
    body: "You know what you're building matters. Prove it to the people that matter for the mission.",
    pulse: null,
  },
  post_submit: {
    tag: "ACCOUNT CREATED",
    lines: ["You're in.", "Check your", "email."],
    accent: 0,
    body: "Your account is live. Set your password and start exploring. We've tailored your sandbox based on what you told us.",
    pulse: "Status: provisioned",
  },
  "The Combine": {
    tag: "PRODUCT \u00B7 THE COMBINE",
    lines: ["Validate", "before you", "build wrong."],
    accent: 2,
    body: "Direct warfighter access to test funded DoD tech before a single production dollar is spent.",
    pulse: "Warfighter-validated",
  },
  "Defense Builders": {
    tag: "PRODUCT \u00B7 DEFENSE BUILDERS",
    lines: ["Days,", "not years,", "to prototype."],
    accent: 0,
    body: "A marketplace pairing problem solvers with problem owners \u2014 tools, trust, and transactions in one place.",
    pulse: "Prototype in 72hrs",
  },
  "Wingman": {
    tag: "PRODUCT \u00B7 WINGMAN",
    lines: ["Your device.", "Your data.", "Your edge."],
    accent: 1,
    body: "Turn any mobile device into a mission asset. Operationalize your inbox. Brief, don't bury.",
    pulse: "Local inference",
  },
  multi_products: {
    tag: "YOUR STARTING POINTS",
    lines: ["The full", "Merge", "arsenal."],
    accent: 1,
    body: "You're tapping into the complete stack \u2014 from problem validation to deployed capability in the hands of the warfighter.",
    pulse: null,
  },
  done: {
    tag: "ACCOUNT LIVE",
    lines: ["Your sandbox", "is ready.", "Sign in."],
    accent: 1,
    body: "Your account is configured based on your selections. Sign in to Guild to start exploring.",
    pulse: "Status: active",
  },
  returning_user: {
    tag: "WELCOME BACK",
    lines: ["Good to", "see you", "again."],
    accent: 2,
    body: "Sign in to pick up where you left off. Your sandbox and selections are waiting.",
    pulse: "Status: active",
  },
  authenticated: {
    tag: "SESSION ACTIVE",
    lines: ["You're", "already", "signed in."],
    accent: 0,
    body: "Your account is live. Head to Guild to access your sandbox, tools, and network.",
    pulse: "Status: active",
  },
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const AREAS = [
  "Problem Solving", "Program Transition", "Building",
  "Deploying Capability", "Commercialization", "Mission Outcomes",
  "National Security", "Allies & Partners",
];

const OUTCOME_ITEMS = [
  "We have a role to fill",
  "Insights that validate assumptions",
  "Field Development",
  "Authority to Operate",
  "Increase mission impact",
  "Transition to a Program Office",
  "Accelerate acquisition or investment",
];

const JOURNEY_STAGES = [
  { id: "I have a problem to solve", icon: "\u25CE", label: "I have a problem to solve", sub: "Looking for the right frame, the right people, or the right proof points" },
  { id: "I have a concept to validate", icon: "\u25C8", label: "I have a concept to validate", sub: "Built something \u2014 need to know if real operators will actually use it" },
  { id: "I'm building a prototype", icon: "\u25C9", label: "I\u2019m building a prototype", sub: "Heads down on the build \u2014 need technical talent, partners, or infrastructure" },
  { id: "I need to scale or transition", icon: "\u2B21", label: "I need to scale or transition", sub: "Have a working system \u2014 struggling with the valley of death" },
  { id: "I'm deployed, optimizing", icon: "\u25C7", label: "I\u2019m deployed, optimizing", sub: "In the field, holding ground, looking to expand impact" },
];

const PRODUCTS = [
  { id: "The Combine", tag: "VALIDATION", label: "The Combine", desc: "Validate funded DoD tech directly with warfighters \u2014 before you build the wrong thing at scale.", icon: "\u2B21" },
  { id: "Defense Builders", tag: "MARKETPLACE", label: "Defense Builders", desc: "Connect problem solvers with problem owners. Build a working prototype in days, not months.", icon: "\u25C8" },
  { id: "Wingman", tag: "MOBILE INTEL", label: "Wingman", desc: "Turn your mobile device into a mission asset. Your data. Your device. Your edge.", icon: "\u25C9" },
];

// Conditional product ordering based on journey stage
const JOURNEY_PRODUCT_ORDER = {
  "I have a problem to solve": ["The Combine", "Defense Builders", "Wingman"],
  "I have a concept to validate": ["The Combine", "Defense Builders", "Wingman"],
  "I'm building a prototype": ["Defense Builders", "The Combine", "Wingman"],
  "I need to scale or transition": ["Defense Builders", "Wingman", "The Combine"],
  "I'm deployed, optimizing": ["Wingman", "Defense Builders", "The Combine"],
};

// ─── VALIDATION ───────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(formData) {
  const errors = {};
  if (!formData.name.trim()) errors.name = "Name is required";
  if (!formData.email.trim()) errors.email = "Email is required";
  else if (!EMAIL_RE.test(formData.email.trim())) errors.email = "Enter a valid email address";
  return errors;
}

// ─── REDUCER ──────────────────────────────────────────────────────────────────
const initialState = {
  step: 1,
  areas: [],
  values: [],
  journey: null,
  products: [],
  formData: { name: "", email: "", org: "" },
  errors: {},
  submitting: false,
  submitError: null,
  turnstileToken: null,
  reqId: null,
  provisioned: false,
  role: null,
  loginUrl: null,
  // OTP flow
  otpSent: false,
  otpCode: "",
  otpVerifying: false,
  otpError: null,
  otpSending: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "TOGGLE_AREA": {
      const s = new Set(state.areas);
      s.has(action.value) ? s.delete(action.value) : s.add(action.value);
      return { ...state, areas: [...s] };
    }
    case "TOGGLE_VALUE": {
      const s = new Set(state.values);
      s.has(action.value) ? s.delete(action.value) : s.add(action.value);
      return { ...state, values: [...s] };
    }
    case "SET_JOURNEY":
      return { ...state, journey: action.value };
    case "TOGGLE_PRODUCT": {
      const s = new Set(state.products);
      s.has(action.value) ? s.delete(action.value) : s.add(action.value);
      return { ...state, products: [...s] };
    }
    case "SET_FORM_FIELD":
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: undefined },
      };
    case "SET_ERRORS":
      return { ...state, errors: action.errors };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SUBMIT_START":
      return { ...state, submitting: true, submitError: null };
    case "SUBMIT_SUCCESS":
      return {
        ...state, submitting: false, step: 5, reqId: action.reqId,
        provisioned: true, role: action.role, loginUrl: action.loginUrl,
      };
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, submitError: action.error };
    case "SET_TURNSTILE":
      return { ...state, turnstileToken: action.token, turnstileErrored: action.errored || false };
    case "OTP_SEND_START":
      return { ...state, otpSending: true, otpError: null, submitError: null };
    case "OTP_SENT":
      return { ...state, otpSending: false, otpSent: true, otpCode: "", otpError: null };
    case "OTP_SEND_ERROR":
      return { ...state, otpSending: false, otpError: action.error };
    case "OTP_SET_CODE":
      return { ...state, otpCode: action.code, otpError: null };
    case "OTP_VERIFY_START":
      return { ...state, otpVerifying: true, otpError: null };
    case "OTP_VERIFY_ERROR":
      return { ...state, otpVerifying: false, otpError: action.error };
    case "OTP_RESET":
      return { ...state, otpSent: false, otpCode: "", otpError: null, otpVerifying: false, otpSending: false };
    case "FINISH":
      return { ...state, step: 6 };
    case "RESTORE":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────
function saveState(state) {
  try {
    const { submitting, submitError, turnstileToken, otpSent, otpCode, otpVerifying, otpError, otpSending, ...saveable } = state;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saveable));
  } catch { /* quota exceeded, ignore */ }
}

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Don't restore past step 4 (submission boundary)
    if (saved.step > 4) return null;
    return saved;
  } catch { return null; }
}

function clearState() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ─── HERO KEY LOGIC ───────────────────────────────────────────────────────────
function getHeroKey(state) {
  const { step, areas, journey, products } = state;
  if (step === "authenticated") return "authenticated";
  if (step === 0) return "returning_user";
  if (step === 1) return "default";
  if (step === 2) {
    if (areas.length === 0) return "default";
    if (areas.length === 1) return areas[0];
    return "multi_areas";
  }
  if (step === 3) return "journey_step";
  if (step === 4) return journey || "contact_step";
  if (step === 5) return "post_submit";
  if (step === 6) {
    if (products.length === 1) return products[0];
    if (products.length > 1) return "multi_products";
    return "done";
  }
  return "done";
}

// ─── HERO PANEL ───────────────────────────────────────────────────────────────
function HeroPanel({ heroKey }) {
  const [displayKey, setDisplayKey] = useState(heroKey);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (heroKey === displayKey) return;
    setVisible(false);
    const t = setTimeout(() => { setDisplayKey(heroKey); setVisible(true); }, 230);
    return () => clearTimeout(t);
  }, [heroKey, displayKey]);

  const h = HERO[displayKey] || HERO.default;

  return (
    <div class="onboarding__hero" aria-hidden="true">
      <div class="onboarding__hero-grid" />
      <div class="onboarding__hero-glow--blue" />
      <div class="onboarding__hero-glow--green" />
      <div class="onboarding__hero-accent" />

      <div class="onboarding__hero-top">
        <a href="/" class="onboarding__wordmark">
          <img src="/content/arrows.png" alt="" class="onboarding__wordmark-logo" />
          <span class="onboarding__wordmark-text"><span class="onboarding__wordmark-merge">Merge</span><span class="onboarding__wordmark-combinator">Combinator</span></span>
        </a>

        <div class={`onboarding__hero-content${visible ? "" : " onboarding__hero-content--hidden"}`}>
          <div class="onboarding__hero-tag-row">
            {h.pulse && <span class="onboarding__hero-pulse" />}
            <span class={`onboarding__hero-tag ${h.pulse ? "onboarding__hero-tag--green" : "onboarding__hero-tag--blue"}`}>
              {h.tag}
            </span>
          </div>

          <h1 class="onboarding__hero-headline">
            {h.lines.map((line, i) => (
              <span key={i} class={i === h.accent ? "accent" : ""}>{line}</span>
            ))}
          </h1>

          <p class="onboarding__hero-body">{h.body}</p>

          {h.pulse && <div class="onboarding__hero-badge">{h.pulse}</div>}
        </div>
      </div>

      <div class="onboarding__hero-stats">
        {[
          { n: "Forward Deployed", l: "problem discovery" },
          { n: "Indo-Pacific", l: "primary focus" },
          { n: "1 to n", l: "build // scale" },
        ].map(s => (
          <div key={s.l}>
            <div class="onboarding__stat-value">{s.n}</div>
            <div class="onboarding__stat-label">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ step }) {
  return (
    <div class="onboarding__progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4} aria-label={`Step ${step} of 4`}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} class={`onboarding__progress-seg${i <= step ? " onboarding__progress-seg--active" : ""}`} />
      ))}
    </div>
  );
}

// ─── STEP 1 — Areas ───────────────────────────────────────────────────────────
function Step1({ areas, dispatch, onNext, loginHref }) {
  const canContinue = areas.length > 0;
  return (
    <div class="onboarding__step">
      <div class="onboarding__step-label">CONFIGURE YOUR PLATFORM &middot; 1 OF 4</div>
      <h2 class="onboarding__step-title">Where are you focused?</h2>
      <p class="onboarding__step-subtitle">Select all that apply so we can save time by validating mutual fit.</p>
      <div class="onboarding__chip-grid" role="group" aria-label="Areas of interest">
        {AREAS.map(a => (
          <button key={a} class="onboarding__chip" type="button"
            aria-pressed={areas.includes(a)}
            onClick={() => { dispatch({ type: "TOGGLE_AREA", value: a }); track("chip_toggle", { step: 1, chip: a }); }}>
            {a}
          </button>
        ))}
      </div>
      <button class="onboarding__btn onboarding__btn--primary-full" disabled={!canContinue} onClick={onNext}>
        Continue &rarr;
      </button>
      <div class="onboarding__step-signin-hint">
        Already have an account? <a href={loginHref}>Sign in &rarr;</a>
      </div>
    </div>
  );
}

// ─── STEP 2 — Outcomes ───────────────────────────────────────────────────────
function Step2({ values, dispatch, onNext, onBack }) {
  const canContinue = values.length > 0;

  return (
    <div class="onboarding__step">
      <div class="onboarding__step-label">CONFIGURE YOUR PLATFORM &middot; 2 OF 4</div>
      <h2 class="onboarding__step-title">What outcome are you looking for?</h2>
      <p class="onboarding__step-subtitle">Select all that apply.</p>
      <div class="onboarding__chip-grid" role="group" aria-label="Desired outcomes">
        {OUTCOME_ITEMS.map(v => (
          <button key={v} class="onboarding__chip" type="button"
            aria-pressed={values.includes(v)}
            onClick={() => { dispatch({ type: "TOGGLE_VALUE", value: v }); track("chip_toggle", { step: 2, chip: v }); }}>
            {v}
          </button>
        ))}
      </div>
      <div class="onboarding__nav">
        <button class="onboarding__btn onboarding__btn--ghost" onClick={onBack}>&larr; Back</button>
        <button class="onboarding__btn onboarding__btn--primary" disabled={!canContinue} onClick={onNext}>Continue &rarr;</button>
      </div>
    </div>
  );
}

// ─── STEP 3 — Journey Stage ───────────────────────────────────────────────────
function Step3({ journey, dispatch, onNext, onBack }) {
  const canContinue = !!journey;
  return (
    <div class="onboarding__step">
      <div class="onboarding__step-label">CONFIGURE YOUR PLATFORM &middot; 3 OF 4</div>
      <h2 class="onboarding__step-title">Where are you in the journey?</h2>
      <p class="onboarding__step-subtitle">Pick the one that best fits where you are right now.</p>
      <div role="radiogroup" aria-label="Journey stage" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
        {JOURNEY_STAGES.map(stage => {
          const sel = journey === stage.id;
          return (
            <button key={stage.id} type="button" role="radio" aria-checked={sel}
              class={`onboarding__card${sel ? " onboarding__card--selected" : ""}`}
              onClick={() => { dispatch({ type: "SET_JOURNEY", value: stage.id }); track("journey_select", { stage: stage.id }); }}>
              <span class="onboarding__card-icon">{stage.icon}</span>
              <div style={{ flex: 1 }}>
                <div class="onboarding__card-label">{stage.label}</div>
                <div class="onboarding__card-sub">{stage.sub}</div>
              </div>
              {sel && <div class="onboarding__card-check">{"\u2713"}</div>}
            </button>
          );
        })}
      </div>
      <div class="onboarding__nav">
        <button class="onboarding__btn onboarding__btn--ghost" onClick={onBack}>&larr; Back</button>
        <button class="onboarding__btn onboarding__btn--primary" disabled={!canContinue} onClick={onNext}>Continue &rarr;</button>
      </div>
    </div>
  );
}

// ─── STEP 4 — Contact Form + OTP Verification ───────────────────────────────
function Step4({ state, dispatch, onBack, onSendOtp, onVerifyOtp, loginHref }) {
  const { formData, errors, otpSent, otpCode, otpSending, otpVerifying, otpError, submitError } = state;
  const otpInputRef = useRef(null);
  const canSendOtp = formData.name.trim() && formData.email.trim() && !otpSending;
  const canVerify = otpCode.length === 6 && !otpVerifying;

  // Auto-focus OTP input when it appears
  useEffect(() => {
    if (otpSent && otpInputRef.current) otpInputRef.current.focus();
  }, [otpSent]);

  const handleSendOtp = () => {
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) {
      dispatch({ type: "SET_ERRORS", errors: errs });
      track("validation_error", { fields: Object.keys(errs) });
      return;
    }
    onSendOtp();
  };

  const handleVerify = () => {
    if (otpCode.trim().length !== 6) {
      dispatch({ type: "OTP_VERIFY_ERROR", error: "Please enter the 6-digit code." });
      return;
    }
    onVerifyOtp();
  };

  const handleOtpInput = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    dispatch({ type: "OTP_SET_CODE", code: val });
  };

  const fields = [
    { key: "name", label: "NAME", placeholder: "Your full name", type: "text", required: true },
    { key: "email", label: "EMAIL", placeholder: "your@organization.gov", type: "email", required: true },
    { key: "org", label: "ORGANIZATION", placeholder: "Optional", type: "text", required: false },
  ];

  // ── OTP verification phase ──
  if (otpSent) {
    return (
      <div class="onboarding__step">
        <div class="onboarding__step-label">VERIFY &middot; 4 OF 4</div>
        <h2 class="onboarding__step-title">Check your email.</h2>
        <p class="onboarding__step-subtitle">
          We sent a 6-digit code to <strong>{formData.email}</strong>. Enter it below to verify your account.
        </p>

        {otpError && <div class="onboarding__error-banner">{otpError}</div>}

        <div class="onboarding__otp-input-wrap">
          <input
            ref={otpInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            value={otpCode}
            class="onboarding__otp-input"
            onInput={handleOtpInput}
            onKeyDown={e => { if (e.key === "Enter" && canVerify) handleVerify(); }}
          />
        </div>

        <button class="onboarding__btn onboarding__btn--primary-full" disabled={!canVerify} onClick={handleVerify}>
          {otpVerifying ? "Verifying\u2026" : "Verify & Create Account \u2192"}
        </button>

        <div class="onboarding__otp-actions">
          <button class="onboarding__btn onboarding__btn--text" onClick={() => {
            dispatch({ type: "OTP_RESET" });
          }}>
            &larr; Change email
          </button>
          <button class="onboarding__btn onboarding__btn--text" disabled={otpSending} onClick={() => {
            onSendOtp();
            track("otp_resend");
          }}>
            Resend code
          </button>
        </div>
      </div>
    );
  }

  // ── Contact form phase ──
  return (
    <div class="onboarding__step">
      <div class="onboarding__step-label">ALMOST INSIDE &middot; 4 OF 4</div>
      <h2 class="onboarding__step-title">Tell us where to reach you.</h2>
      <p class="onboarding__step-subtitle">We'll send a verification code to confirm your email &mdash; no password needed.</p>

      {(submitError || otpError) && <div class="onboarding__error-banner">{submitError || otpError}</div>}

      <div class="onboarding__fields">
        {fields.map(f => (
          <div key={f.key}>
            <label class="onboarding__field-label" for={`ob-${f.key}`}>{f.label}{f.required && " *"}</label>
            <input
              id={`ob-${f.key}`}
              type="text"
              inputMode={f.type === "email" ? "email" : "text"}
              placeholder={f.placeholder}
              value={formData[f.key]}
              aria-required={f.required}
              aria-invalid={!!errors[f.key]}
              aria-describedby={errors[f.key] ? `ob-${f.key}-error` : undefined}
              class={`onboarding__field-input${errors[f.key] ? " onboarding__field-input--error" : ""}`}
              onInput={e => dispatch({ type: "SET_FORM_FIELD", field: f.key, value: e.target.value })}
              onBlur={e => {
                if (f.required && !e.target.value.trim()) {
                  dispatch({ type: "SET_ERRORS", errors: { ...errors, [f.key]: `${f.label} is required` } });
                } else if (f.key === "email" && e.target.value.trim() && !EMAIL_RE.test(e.target.value.trim())) {
                  dispatch({ type: "SET_ERRORS", errors: { ...errors, email: "Enter a valid email address" } });
                }
              }}
            />
            <div id={`ob-${f.key}-error`} class="onboarding__field-error" role="alert">
              {errors[f.key] || ""}
            </div>
          </div>
        ))}
      </div>

      <button class="onboarding__btn onboarding__btn--primary-full" disabled={!canSendOtp} onClick={handleSendOtp}>
        {otpSending ? "Sending code\u2026" : "Send verification code \u2192"}
      </button>
      <button class="onboarding__btn onboarding__btn--text" onClick={onBack}>&larr; Back</button>

      <div class="onboarding__signin">
        <p class="onboarding__signin-label">Already a member?</p>
        <div class="onboarding__signin-row">
          <a href={loginHref} class="onboarding__signin-btn">Sign in with Email &rarr;</a>
          <a href={loginHref}
            class="onboarding__signin-btn onboarding__signin-btn--google">Continue via SSO</a>
          <div style={{ position: "relative" }}>
            <span class="onboarding__signin-cac">CAC/PIV</span>
            <span class="onboarding__signin-cac-badge">soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 5 — Account Created (post-submit, instant provisioning) ────────────
function Step5({ products, journey, role, loginUrl, dispatch, onDone }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 100); return () => clearTimeout(t); }, []);

  const autoPromoted = role && role !== "restricted";

  // Order products based on journey stage
  const orderedProducts = getOrderedProducts(journey);

  return (
    <div class={`onboarding__reveal${revealed ? " onboarding__reveal--visible" : ""}`}>
      <div class="onboarding__confirmed">
        <span class="onboarding__confirmed-icon">{"\u2713"}</span>
        <div>
          <div class="onboarding__confirmed-title">Account Created</div>
          <div class="onboarding__confirmed-text">
            {autoPromoted
              ? "Your credentials were verified. Full access is ready."
              : "Check your email to set your password and start exploring."}
          </div>
        </div>
      </div>

      {autoPromoted && (
        <div class="onboarding__promoted-badge">
          Verified &middot; Full access granted
        </div>
      )}

      <h2 class="onboarding__step-title">Where do you want to start?</h2>
      <p class="onboarding__step-subtitle">
        {autoPromoted
          ? "Your sandbox is ready. Select your starting points and we'll have the right doors open."
          : "While you set your password, tell us where you want to start. We'll tailor your sandbox."}
      </p>

      <div role="group" aria-label="Product selection" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
        {orderedProducts.map(p => {
          const sel = products.includes(p.id);
          return (
            <button key={p.id} type="button" aria-pressed={sel}
              class={`onboarding__product-card${sel ? " onboarding__product-card--selected" : ""}`}
              onClick={() => { dispatch({ type: "TOGGLE_PRODUCT", value: p.id }); track("product_toggle", { product: p.id }); }}>
              <div class="onboarding__product-header">
                <span class="onboarding__product-icon">{p.icon}</span>
                <span class="onboarding__product-tag">{p.tag}</span>
                {sel && <span class="onboarding__product-check">{"\u2713"}</span>}
              </div>
              <div class="onboarding__product-name">{p.label}</div>
              <div class="onboarding__product-desc">{p.desc}</div>
            </button>
          );
        })}
      </div>

      <button
        class={`onboarding__btn ${products.length > 0 ? "onboarding__btn--green" : "onboarding__btn--muted"}`}
        onClick={() => { track("products_done", { products }); onDone(); }}>
        {products.length > 0 ? "Save & continue \u2192" : "Skip for now \u2192"}
      </button>
    </div>
  );
}

function getOrderedProducts(journey) {
  if (!journey || !JOURNEY_PRODUCT_ORDER[journey]) return PRODUCTS;
  const order = JOURNEY_PRODUCT_ORDER[journey];
  return order.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
}

// ─── DONE SCREEN ──────────────────────────────────────────────────────────────
function DoneScreen({ products, loginUrl, role }) {
  const autoPromoted = role && role !== "restricted";
  return (
    <div class="onboarding__done">
      <div class="onboarding__done-check">{"\u2713"}</div>
      <h2 class="onboarding__done-title">
        {autoPromoted ? "You're in." : "Almost there."}
      </h2>
      <p class="onboarding__done-body">
        {autoPromoted
          ? "Your account is live with full access. Sign in to start exploring your sandbox."
          : "Check your email to set your password. Your sandbox is being configured based on your selections."}
        {products.length > 0 && " We've noted your starting points."}
      </p>
      {loginUrl && (
        <a href={loginUrl} class="onboarding__btn onboarding__btn--primary-full" style={{ display: "block", textAlign: "center", marginTop: 24 }}>
          Sign in to Guild &rarr;
        </a>
      )}
    </div>
  );
}

// ─── AUTHENTICATED SCREEN ────────────────────────────────────────────────────
function AuthenticatedScreen({ user }) {
  const displayName = user?.name || user?.email?.split("@")[0] || "Operator";
  return (
    <div class="onboarding__done">
      <div class="onboarding__done-check">{"\u2713"}</div>
      <h2 class="onboarding__done-title">Welcome back, {displayName}.</h2>
      <p class="onboarding__done-body">
        You're already signed in. Head to your dashboard to continue.
      </p>
      <a href="https://guild.mergecombinator.com" class="onboarding__btn onboarding__btn--primary-full" style={{ display: "block", textAlign: "center", marginTop: 24 }}>
        Go to Guild &rarr;
      </a>
      <a href="/" class="onboarding__btn onboarding__btn--text" style={{ marginTop: 12, textAlign: "center" }}>
        &larr; Back to home
      </a>
    </div>
  );
}

// ─── WELCOME BACK (Step 0 — returning users) ─────────────────────────────────
function WelcomeBack({ onNewUser, loginHref, referralContext }) {
  const copy = getWelcomeCopy(referralContext);
  return (
    <div class="onboarding__step">
      <div class="onboarding__step-label">WELCOME BACK</div>
      <h2 class="onboarding__step-title">{copy.title}</h2>
      <p class="onboarding__step-subtitle">
        {copy.subtitle}
      </p>

      <div class="onboarding__signin onboarding__signin--welcome">
        <div class="onboarding__signin-row" style={{ marginBottom: 12 }}>
          <a href={loginHref} class="onboarding__btn onboarding__btn--primary-full" style={{ textAlign: "center", textDecoration: "none" }}>
            {copy.cta}
          </a>
        </div>
        <div class="onboarding__signin-row">
          <a href={loginHref}
            class="onboarding__signin-btn onboarding__signin-btn--google" style={{ flex: 1 }}>Continue via SSO</a>
          <div style={{ position: "relative" }}>
            <span class="onboarding__signin-cac">CAC/PIV</span>
            <span class="onboarding__signin-cac-badge">soon</span>
          </div>
        </div>
      </div>

      <div class="onboarding__divider" style={{ margin: "28px 0" }}>
        <div class="onboarding__divider-line" />
        <span class="onboarding__divider-text">or</span>
        <div class="onboarding__divider-line" />
      </div>

      <button class="onboarding__btn onboarding__btn--ghost" style={{ width: "100%" }} onClick={onNewUser}>
        I'm new here &mdash; request access &rarr;
      </button>
    </div>
  );
}

// ─── MOBILE ACTION BAR ───────────────────────────────────────────────────────
function MobileActionBar({ step, state, onAction, onBack }) {
  // Only show for steps 1-4 (active form steps)
  if (typeof step !== "number" || step < 1 || step > 4) return null;

  let label, disabled, backLabel;

  if (step === 4 && state.otpSent) {
    label = state.otpVerifying ? "Verifying\u2026" : "Verify & Create Account";
    disabled = state.otpCode.length !== 6 || state.otpVerifying;
    backLabel = "Change email";
  } else if (step === 4) {
    label = state.otpSending ? "Sending code\u2026" : "Send verification code";
    disabled = !state.formData.name.trim() || !state.formData.email.trim() || state.otpSending;
    backLabel = "Back";
  } else {
    label = "Continue";
    disabled = step === 1 ? state.areas.length === 0
      : step === 2 ? state.values.length === 0
      : step === 3 ? !state.journey
      : false;
    backLabel = step > 1 ? "Back" : null;
  }

  return (
    <div class="onboarding__mobile-bar">
      {backLabel && (
        <button class="onboarding__mobile-bar-back" onClick={onBack}>
          &larr; {backLabel}
        </button>
      )}
      <button class="onboarding__mobile-bar-action" disabled={disabled} onClick={onAction}>
        {label} &rarr;
      </button>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function MCOnboarding() {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const saved = loadState();
    const base = saved ? { ...init, ...saved } : init;
    // If user previously completed onboarding, start at welcome-back gate
    try {
      if (localStorage.getItem(COMPLETED_KEY) && base.step <= 1) {
        return { ...base, step: 0 };
      }
    } catch { /* localStorage blocked */ }
    return base;
  });

  const [authUser, setAuthUser] = useState(null);
  const liveRef = useRef(null);
  const { step } = state;
  const heroKey = getHeroKey(state);
  const loginReturnTo = resolveAccessReturnTo();
  const loginHref = buildLoginHref(loginReturnTo);
  const referralContext = getReferralContextFromReturnTo(loginReturnTo);
  const entryMeta = getAccessEntryMeta();
  const opportunityContext = getOpportunityEntryContext();
  const sessionId = getOrCreateSessionStorageId(ACCESS_SESSION_KEY, "access-session");
  const journeyId = getOrCreateSessionStorageId(ACCESS_JOURNEY_KEY, "access-journey");

  useEffect(() => {
    setAnalyticsContext({
      session_id: sessionId,
      journey_id: journeyId,
      context: entryMeta.context || referralContext || "none",
      source: entryMeta.source || "none",
      referrerHost: entryMeta.referrerHost || null,
      return_bucket: toReturnBucket(loginReturnTo),
      opportunity_id: opportunityContext?.id || null,
      opportunity_code: opportunityContext?.code || null,
      opportunity_title: opportunityContext?.title || null,
    });
  }, [sessionId, journeyId, entryMeta.context, entryMeta.source, entryMeta.referrerHost, referralContext, loginReturnTo, opportunityContext]);

  // Check if user is already authenticated — skip onboarding entirely
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/auth/me", { credentials: "same-origin" });
        if (!res.ok) return;
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return;
        const data = await res.json();
        if (data.authenticated && data.user) {
          setAuthUser(data.user);
          dispatch({ type: "SET_STEP", step: "authenticated" });
        }
      } catch { /* auth check failed, continue normally */ }
    })();
  }, []);

  // Record initial access entry context for referral quality analytics.
  useEffect(() => {
    track("access_entry", {
      context: entryMeta.context,
      source: entryMeta.source,
      referrerHost: entryMeta.referrerHost,
      resolvedReturnTo: loginReturnTo,
      opportunityId: opportunityContext?.id || null,
      opportunityCode: opportunityContext?.code || null,
      opportunityTitle: opportunityContext?.title || null,
    });
  // Intentionally fire once on initial render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state on every change (pre-submission only)
  useEffect(() => {
    if (typeof step === "number" && step >= 1 && step <= 4) saveState(state);
  }, [state]);

  // Announce step changes to screen readers
  useEffect(() => {
    if (liveRef.current) {
      const labels = { "authenticated": "You are already signed in.", 0: "Welcome back. Sign in or request new access.", 1: "Step 1: Areas of interest", 2: "Step 2: Value preferences", 3: "Step 3: Journey stage", 4: "Step 4: Contact information", 5: "Request submitted. Optional: select starting products", 6: "Done. Your request is in the queue." };
      liveRef.current.textContent = labels[step] || "";
    }
    track("step_view", { step });
  }, [step]);

  const goTo = useCallback((s) => dispatch({ type: "SET_STEP", step: s }), []);

  // ── Send OTP to user's email ──
  const handleSendOtp = useCallback(async () => {
    const email = state.formData.email.trim();
    const name = state.formData.name.trim();
    dispatch({ type: "OTP_SEND_START" });
    track("otp_send_start", { email });

    // Probe new API with a quick OPTIONS-safe GET first to detect CORS issues
    let apiAvailable = false;
    try {
      const probe = await fetch(`${API_ENDPOINT.replace("/provision", "")}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (!probe.ok) {
        let msg = `HTTP ${probe.status}`;
        try { const body = await probe.json(); msg = body?.error?.message || msg; } catch { /* non-JSON response */ }
        if (probe.status >= 500) throw new TypeError(msg); // treat server errors as retriable/fallback
        throw new Error(msg);
      }
      await probe.json(); // consume body
      apiAvailable = true;
      dispatch({ type: "OTP_SENT" });
      track("otp_sent", { email });
    } catch (e) {
      // CORS blocked, network error, or server error — fall back to legacy
      const isNetwork = e instanceof TypeError || /load failed|failed to fetch|networkerror|access control/i.test(e.message);
      if (isNetwork) {
        track("otp_fallback_legacy", { reason: e.message });
        await handleLegacySubmit();
        return;
      }
      dispatch({ type: "OTP_SEND_ERROR", error: e.message || "Failed to send code. Please try again." });
      track("otp_send_error", { error: e.message });
    }
  }, [state]);

  // ── Verify OTP and provision account ──
  const handleVerifyOtp = useCallback(async () => {
    const email = state.formData.email.trim();
    const name = state.formData.name.trim();
    const code = state.otpCode.trim();
    dispatch({ type: "OTP_VERIFY_START" });
    track("otp_verify_start", {});

    try {
      const res = await fetch(`${API_ENDPOINT.replace("/provision", "")}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, name, code,
          organization: state.formData.org.trim() || undefined,
          areas: state.areas,
          outcomes: state.values,
          journeyStage: state.journey,
          source: window.location.href,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        const msg = body?.error?.code === "EMAIL_EXISTS"
          ? "An account with this email already exists. Try signing in instead."
          : body?.error?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const { profileId, role, loginUrl } = body.data;
      clearState();
      try { localStorage.setItem(COMPLETED_KEY, "1"); } catch { /* ignore */ }
      dispatch({ type: "SUBMIT_SUCCESS", reqId: profileId, role, loginUrl });
      track("submit_success", { profileId, role, verified: true });
    } catch (e) {
      const isNetwork = e instanceof TypeError || /load failed|failed to fetch|networkerror/i.test(e.message);
      const msg = isNetwork
        ? "Network error — please check your connection and try again."
        : e.message || "Verification failed. Please try again.";
      dispatch({ type: "OTP_VERIFY_ERROR", error: msg });
      track("otp_verify_error", { error: e.message });
    }
  }, [state]);

  // ── Legacy fallback (direct provision without OTP) ──
  const handleLegacySubmit = useCallback(async () => {
    dispatch({ type: "SUBMIT_START" });
    const name = state.formData.name.trim();
    const email = state.formData.email.trim();
    try {
      const res = await fetch(LEGACY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email,
          interests: state.areas.slice(0, 3),
          "cf-turnstile-response": "fallback-no-turnstile",
          source: window.location.href,
          requestedAt: new Date().toISOString(),
        }),
      });
      // Accept 200-299 and also 400 (Turnstile validation) as "submitted"
      // since the user data was received even if bot check failed
      if (res.ok || res.status === 400) {
        clearState();
        try { localStorage.setItem(COMPLETED_KEY, "1"); } catch { /* ignore */ }
        dispatch({ type: "SUBMIT_SUCCESS", reqId: "pending", role: "restricted" });
        track("submit_success", { legacy: true });
      } else {
        throw new Error("Submission failed");
      }
    } catch (e) {
      dispatch({ type: "SUBMIT_ERROR", error: "Network error — please check your connection and try again." });
    }
  }, [state]);

  // Mobile action bar handler — dispatches the right action for the current step
  const handleMobileAction = useCallback(() => {
    if (step === 1 && state.areas.length > 0) goTo(2);
    else if (step === 2 && state.values.length > 0) goTo(3);
    else if (step === 3 && state.journey) goTo(4);
    else if (step === 4 && state.otpSent) handleVerifyOtp();
    else if (step === 4) handleSendOtp();
  }, [step, state, goTo, handleSendOtp, handleVerifyOtp]);

  const handleMobileBack = useCallback(() => {
    if (step === 4 && state.otpSent) dispatch({ type: "OTP_RESET" });
    else if (step === 2) goTo(1);
    else if (step === 3) goTo(2);
    else if (step === 4) goTo(3);
  }, [step, state, goTo, dispatch]);

  return (
    <div class="onboarding">
      {/* Screen reader live region */}
      <div ref={liveRef} class="onboarding__sr-only" aria-live="polite" aria-atomic="true" />

      <HeroPanel heroKey={heroKey} />

      <div class="onboarding__form">
        <div class="onboarding__form-inner">
          {typeof step === "number" && step >= 1 && step <= 4 && <ProgressBar step={step} />}
          {opportunityContext && typeof step === "number" && step >= 1 && step <= 5 && (
            <div
              style={{
                marginBottom: 18,
                padding: "12px 14px",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                background: "rgba(59, 130, 246, 0.08)",
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(125, 211, 252, 0.95)",
                  marginBottom: 6,
                }}
              >
                Opportunity Context
              </div>
              <div style={{ fontSize: 14, color: "rgba(229, 229, 229, 0.96)", lineHeight: 1.5 }}>
                {opportunityContext.title || "Selected opportunity"}
                {opportunityContext.code ? ` (${opportunityContext.code})` : ""}
              </div>
              <div style={{ fontSize: 13, color: "rgba(229, 229, 229, 0.62)", marginTop: 4 }}>
                We’ll keep this attached to your request so we can route you to the right operators,
                programs, and follow-up.
              </div>
            </div>
          )}
          {step === 5 && (
            <div class="onboarding__divider">
              <div class="onboarding__divider-line" />
              <span class="onboarding__divider-text">Account created</span>
              <div class="onboarding__divider-line" />
            </div>
          )}

          {step === "authenticated" ? (
            <AuthenticatedScreen user={authUser} />
          ) : step === 0 ? (
            <WelcomeBack onNewUser={() => goTo(1)} loginHref={loginHref} referralContext={referralContext} />
          ) : step === 6 ? (
            <DoneScreen products={state.products} loginUrl={state.loginUrl} role={state.role} />
          ) : step === 1 ? (
            <Step1 areas={state.areas} dispatch={dispatch} onNext={() => goTo(2)} loginHref={loginHref} />
          ) : step === 2 ? (
            <Step2 values={state.values} dispatch={dispatch} onNext={() => goTo(3)} onBack={() => goTo(1)} />
          ) : step === 3 ? (
            <Step3 journey={state.journey} dispatch={dispatch} onNext={() => goTo(4)} onBack={() => goTo(2)} />
          ) : step === 4 ? (
            <Step4 state={state} dispatch={dispatch} onBack={() => goTo(3)} onSendOtp={handleSendOtp} onVerifyOtp={handleVerifyOtp} loginHref={loginHref} />
          ) : (
            <Step5 products={state.products} journey={state.journey} role={state.role} loginUrl={state.loginUrl} dispatch={dispatch} onDone={() => dispatch({ type: "FINISH" })} />
          )}
        </div>
      </div>

      <MobileActionBar step={step} state={state} onAction={handleMobileAction} onBack={handleMobileBack} />
    </div>
  );
}
