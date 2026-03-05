import { useState, useEffect, useReducer, useRef, useCallback } from "preact/hooks";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const API_ENDPOINT = "https://api.sigmablox.com/api/access-request";
const STORAGE_KEY = "mc-onboarding-state";
const TURNSTILE_SITE_KEY = document.body?.dataset?.turnstileSiteKey || "";

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function track(event, data = {}) {
  const detail = { event, timestamp: Date.now(), ...data };
  window.dispatchEvent(new CustomEvent("mc:onboarding", { detail }));
  if (import.meta.env.DEV) console.debug("[onboarding]", event, data);
}

// ─── HERO STATE MAP ───────────────────────────────────────────────────────────
const HERO = {
  default: {
    tag: "VENTURE STUDIO \u00B7 NATIONAL SECURITY",
    lines: ["Build what", "the mission", "demands."],
    accent: 2,
    body: "We co-found and build new ventures to solve urgent operational problems \u2014 with a relentless focus on Indo-Pacific deterrence.",
    pulse: null,
  },
  "Problem Solving": {
    tag: "PROBLEM DISCOVERY",
    lines: ["The best", "problems aren't", "in the RFP."],
    accent: 1,
    body: "We embed with operators before requirements are written \u2014 surfacing the problems worth solving before anyone else sees them.",
    pulse: "Signal: active",
  },
  "Transition": {
    tag: "TECHNOLOGY TRANSITION",
    lines: ["The valley", "of death", "is real."],
    accent: 2,
    body: "Most defense tech dies between prototype and program of record. Our transition engineering model was built for exactly that gap.",
    pulse: "TRL 4 \u2192 7",
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
    body: "We know every shortcut through the acquisition process \u2014 and when to use them. Speed is a strategic advantage.",
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
    lines: ["Full lifecycle.", "Every hard", "transition."],
    accent: 0,
    body: "From problem discovery to fielded capability \u2014 we operate across the entire arc of the mission.",
    pulse: null,
  },
  values_selected: {
    tag: "HOW MERGE COMBINATOR DELIVERS",
    lines: ["Privileged", "access.", "Tangible upside."],
    accent: 0,
    body: "We don't just connect dots. We hold equity, shape requirements, and co-sign the outcome alongside you.",
    pulse: "Tier 1 venture",
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
    lines: ["One step", "from the", "network."],
    accent: 2,
    body: "You've identified what matters. We personally review every request \u2014 we're looking for builders who are serious about the mission.",
    pulse: "Review: pending",
  },
  post_submit: {
    tag: "REQUEST RECEIVED",
    lines: ["You're in", "the queue.", "Welcome."],
    accent: 0,
    body: "While we review your access, tell us where you want to start. We'll have the right doors open when you arrive.",
    pulse: "Status: reviewing",
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
    tag: "ACCESS REQUESTED",
    lines: ["Expect us", "within", "48 hours."],
    accent: 1,
    body: "We personally review every application. If you're serious about the mission, we'll find each other.",
    pulse: "Status: reviewing",
  },
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const AREAS = [
  "Problem Solving", "Transition", "Building",
  "Deploying Capability", "Mission Outcomes",
  "National Security", "Allies & Partners",
];

const VALUE_ITEMS = [
  "Insights from the Theater", "Problem Mapping",
  "Product Validation", "Red Teaming",
  "Tech Adoption", "Acquisition & Funding",
  "Manufacturing", "Building for Scale",
  "Compliance (ATO, CMMC, FedRAMP)", "Cybersecurity",
];

// Conditional value ordering based on journey stage
const JOURNEY_VALUE_PRIORITY = {
  "I have a problem to solve": ["Problem Mapping", "Insights from the Theater", "Red Teaming", "Product Validation"],
  "I have a concept to validate": ["Product Validation", "Red Teaming", "Insights from the Theater", "Problem Mapping"],
  "I'm building a prototype": ["Manufacturing", "Building for Scale", "Tech Adoption", "Cybersecurity"],
  "I need to scale or transition": ["Acquisition & Funding", "Compliance (ATO, CMMC, FedRAMP)", "Building for Scale", "Tech Adoption"],
  "I'm deployed, optimizing": ["Cybersecurity", "Compliance (ATO, CMMC, FedRAMP)", "Acquisition & Funding", "Building for Scale"],
};

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
      return { ...state, submitting: false, step: 5, reqId: action.reqId };
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, submitError: action.error };
    case "SET_TURNSTILE":
      return { ...state, turnstileToken: action.token };
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
    const { submitting, submitError, turnstileToken, ...saveable } = state;
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
  if (step === 1) return "default";
  if (step === 2) {
    if (areas.length === 0) return "default";
    if (areas.length === 1) return areas[0];
    return "multi_areas";
  }
  if (step === 3) return "values_selected";
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
          <div class="onboarding__wordmark-icon">M</div>
          <span class="onboarding__wordmark-text">MERGE COMBINATOR</span>
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
          { n: "47+", l: "ventures co-founded" },
          { n: "Indo-Pac", l: "primary focus" },
          { n: "End-to-end", l: "build model" },
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
function Step1({ areas, dispatch, onNext }) {
  const canContinue = areas.length > 0;
  return (
    <div class="onboarding__step">
      <div class="onboarding__step-label">CONFIGURE YOUR ACCESS \u00B7 1 OF 4</div>
      <h2 class="onboarding__step-title">Which of these areas interest you?</h2>
      <p class="onboarding__step-subtitle">Select all that apply \u2014 we'll tailor what we show you.</p>
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
        Continue \u2192
      </button>
    </div>
  );
}

// ─── STEP 2 — Values (conditionally ordered by journey if going back) ─────────
function Step2({ values, journey, dispatch, onNext, onBack }) {
  const canContinue = values.length > 0;
  // If journey was already selected (user went back), prioritize relevant values
  const orderedValues = getOrderedValues(journey);

  return (
    <div class="onboarding__step">
      <div class="onboarding__step-label">CONFIGURE YOUR ACCESS \u00B7 2 OF 4</div>
      <h2 class="onboarding__step-title">What would you find most valuable?</h2>
      <p class="onboarding__step-subtitle">Merge Combinator empowers change agents to solve hard problems at scale.</p>
      <div class="onboarding__chip-grid" role="group" aria-label="Value preferences">
        {orderedValues.map(v => (
          <button key={v} class="onboarding__chip" type="button"
            aria-pressed={values.includes(v)}
            onClick={() => { dispatch({ type: "TOGGLE_VALUE", value: v }); track("chip_toggle", { step: 2, chip: v }); }}>
            {v}
          </button>
        ))}
      </div>
      <div class="onboarding__nav">
        <button class="onboarding__btn onboarding__btn--ghost" onClick={onBack}>{"\u2190"} Back</button>
        <button class="onboarding__btn onboarding__btn--primary" disabled={!canContinue} onClick={onNext}>Continue \u2192</button>
      </div>
    </div>
  );
}

function getOrderedValues(journey) {
  if (!journey || !JOURNEY_VALUE_PRIORITY[journey]) return VALUE_ITEMS;
  const priority = JOURNEY_VALUE_PRIORITY[journey];
  const rest = VALUE_ITEMS.filter(v => !priority.includes(v));
  return [...priority, ...rest];
}

// ─── STEP 3 — Journey Stage ───────────────────────────────────────────────────
function Step3({ journey, dispatch, onNext, onBack }) {
  const canContinue = !!journey;
  return (
    <div class="onboarding__step">
      <div class="onboarding__step-label">CONFIGURE YOUR ACCESS \u00B7 3 OF 4</div>
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
        <button class="onboarding__btn onboarding__btn--ghost" onClick={onBack}>{"\u2190"} Back</button>
        <button class="onboarding__btn onboarding__btn--primary" disabled={!canContinue} onClick={onNext}>Continue \u2192</button>
      </div>
    </div>
  );
}

// ─── STEP 4 — Contact Form ────────────────────────────────────────────────────
function Step4({ state, dispatch, onBack, onSubmit }) {
  const { formData, errors, submitting, submitError, turnstileToken } = state;
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);
  const canSubmit = formData.name.trim() && formData.email.trim() && !submitting;

  // Initialize Turnstile
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !window.turnstile || !turnstileRef.current) return;
    if (turnstileWidgetId.current != null) return;

    // Managed mode: invisible 99% of the time, checkbox fallback for
    // ambiguous signals. Free unlimited requests (invisible caps at 1M/mo).
    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      size: "compact",
      theme: "dark",
      callback: (token) => dispatch({ type: "SET_TURNSTILE", token }),
      "error-callback": () => dispatch({ type: "SET_TURNSTILE", token: null }),
      "expired-callback": () => dispatch({ type: "SET_TURNSTILE", token: null }),
    });

    return () => {
      if (turnstileWidgetId.current != null && window.turnstile) {
        window.turnstile.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    };
  }, []);

  const handleSubmit = () => {
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) {
      dispatch({ type: "SET_ERRORS", errors: errs });
      track("validation_error", { fields: Object.keys(errs) });
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      dispatch({ type: "SET_ERRORS", errors: { ...errs, _turnstile: "Please complete the verification" } });
      return;
    }
    onSubmit();
  };

  const fields = [
    { key: "name", label: "NAME", placeholder: "Your full name", type: "text", required: true },
    { key: "email", label: "EMAIL", placeholder: "your@organization.gov", type: "email", required: true },
    { key: "org", label: "ORGANIZATION", placeholder: "Optional", type: "text", required: false },
  ];

  return (
    <div class="onboarding__step">
      <div class="onboarding__step-label">ALMOST INSIDE \u00B7 4 OF 4</div>
      <h2 class="onboarding__step-title">Tell us where to reach you.</h2>
      <p class="onboarding__step-subtitle">We personally review every request. Expect to hear back within 48 hours.</p>

      {submitError && <div class="onboarding__error-banner">{submitError}</div>}

      <div class="onboarding__fields">
        {fields.map(f => (
          <div key={f.key}>
            <label class="onboarding__field-label" for={`ob-${f.key}`}>{f.label}{f.required && " *"}</label>
            <input
              id={`ob-${f.key}`}
              type={f.type}
              placeholder={f.placeholder}
              value={formData[f.key]}
              required={f.required}
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

      <div ref={turnstileRef} class="onboarding__turnstile" />

      <button class="onboarding__btn onboarding__btn--primary-full" disabled={!canSubmit} onClick={handleSubmit}>
        {submitting ? "Submitting\u2026" : "Request Access \u2192"}
      </button>
      <button class="onboarding__btn onboarding__btn--text" onClick={onBack}>{"\u2190"} Back</button>

      <div class="onboarding__signin">
        <p class="onboarding__signin-label">Already a member?</p>
        <div class="onboarding__signin-row">
          <a href="/auth/login" class="onboarding__signin-btn">Sign in with Email \u2192</a>
          <a href="https://api.sigmablox.com/auth/sso/start?provider=google&returnTo=https://mergecombinator.com/"
            class="onboarding__signin-btn onboarding__signin-btn--google">Google</a>
          <div style={{ position: "relative" }}>
            <span class="onboarding__signin-cac">CAC/PIV</span>
            <span class="onboarding__signin-cac-badge">soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 5 — Where to Start (post-submit, conditional on journey) ────────────
function Step5({ products, journey, dispatch, onDone }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { const t = setTimeout(() => setRevealed(true), 100); return () => clearTimeout(t); }, []);

  // Order products based on journey stage
  const orderedProducts = getOrderedProducts(journey);

  return (
    <div class={`onboarding__reveal${revealed ? " onboarding__reveal--visible" : ""}`}>
      <div class="onboarding__confirmed">
        <span class="onboarding__confirmed-icon">{"\u2713"}</span>
        <div>
          <div class="onboarding__confirmed-title">Request Submitted</div>
          <div class="onboarding__confirmed-text">We'll review and reach out within 48 hours.</div>
        </div>
      </div>

      <h2 class="onboarding__step-title">Where do you want to start?</h2>
      <p class="onboarding__step-subtitle">When your access is approved, we'll have the right doors open. Select any that interest you.</p>

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
        {products.length > 0 ? "Save my preferences \u2192" : "Skip for now \u2192"}
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
function DoneScreen({ products, reqId }) {
  return (
    <div class="onboarding__done">
      <div class="onboarding__done-check">{"\u2713"}</div>
      <h2 class="onboarding__done-title">You're in the queue.</h2>
      <p class="onboarding__done-body">
        We'll review your application and reach out within 48 hours.
        {products.length > 0 && " We've noted your starting points."}
      </p>
      {reqId && <div class="onboarding__done-id">Request \u00B7 {reqId}</div>}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function MCOnboarding() {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const saved = loadState();
    return saved ? { ...init, ...saved } : init;
  });

  const liveRef = useRef(null);
  const { step } = state;
  const heroKey = getHeroKey(state);

  // Persist state on every change (pre-submission only)
  useEffect(() => {
    if (step <= 4) saveState(state);
  }, [state]);

  // Announce step changes to screen readers
  useEffect(() => {
    if (liveRef.current) {
      const labels = { 1: "Step 1: Areas of interest", 2: "Step 2: Value preferences", 3: "Step 3: Journey stage", 4: "Step 4: Contact information", 5: "Request submitted. Optional: select starting products", 6: "Done. Your request is in the queue." };
      liveRef.current.textContent = labels[step] || "";
    }
    track("step_view", { step });
  }, [step]);

  const goTo = useCallback((s) => dispatch({ type: "SET_STEP", step: s }), []);

  const handleSubmit = useCallback(async () => {
    const errs = validateForm(state.formData);
    if (Object.keys(errs).length > 0) {
      dispatch({ type: "SET_ERRORS", errors: errs });
      return;
    }

    dispatch({ type: "SUBMIT_START" });
    track("submit_start", {});

    const payload = {
      name: state.formData.name.trim(),
      email: state.formData.email.trim(),
      organization: state.formData.org.trim() || undefined,
      interests: state.areas,
      values: state.values,
      journeyStage: state.journey,
      "cf-turnstile-response": state.turnstileToken || "",
      source: window.location.href,
      requestedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reqId = Math.random().toString(36).slice(2, 10).toUpperCase();
      clearState();
      dispatch({ type: "SUBMIT_SUCCESS", reqId });
      track("submit_success", { reqId });
    } catch (err) {
      dispatch({ type: "SUBMIT_ERROR", error: "Something went wrong. Please try again or email access@mergecombinator.com" });
      track("submit_error", { error: err.message });
    }
  }, [state]);

  return (
    <div class="onboarding">
      {/* Screen reader live region */}
      <div ref={liveRef} class="onboarding__sr-only" aria-live="polite" aria-atomic="true" />

      <HeroPanel heroKey={heroKey} />

      <div class="onboarding__form">
        <div class="onboarding__form-inner">
          {step <= 4 && <ProgressBar step={step} />}
          {step === 5 && (
            <div class="onboarding__divider">
              <div class="onboarding__divider-line" />
              <span class="onboarding__divider-text">Your access is being reviewed</span>
              <div class="onboarding__divider-line" />
            </div>
          )}

          {step === 6 ? (
            <DoneScreen products={state.products} reqId={state.reqId} />
          ) : step === 1 ? (
            <Step1 areas={state.areas} dispatch={dispatch} onNext={() => goTo(2)} />
          ) : step === 2 ? (
            <Step2 values={state.values} journey={state.journey} dispatch={dispatch} onNext={() => goTo(3)} onBack={() => goTo(1)} />
          ) : step === 3 ? (
            <Step3 journey={state.journey} dispatch={dispatch} onNext={() => goTo(4)} onBack={() => goTo(2)} />
          ) : step === 4 ? (
            <Step4 state={state} dispatch={dispatch} onBack={() => goTo(3)} onSubmit={handleSubmit} />
          ) : (
            <Step5 products={state.products} journey={state.journey} dispatch={dispatch} onDone={() => dispatch({ type: "FINISH" })} />
          )}
        </div>
      </div>
    </div>
  );
}
