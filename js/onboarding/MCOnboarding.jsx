import { useState, useEffect } from "react";

// ─── BRAND TOKENS ─────────────────────────────────────────────────────────────
const C = {
  nearBlack:     "#0B0E11",
  charcoal:      "#1C232B",
  slate:         "#2C3036",
  offWhite:      "#F2F5F7",
  white:         "#FFFFFF",
  signalBlue:    "#2A7FDB",
  operatorGreen: "#5DA06F",
  blueFaint:     "rgba(42,127,219,0.10)",
  blueSubtle:    "rgba(42,127,219,0.18)",
  greenFaint:    "rgba(93,160,111,0.10)",
  greenSubtle:   "rgba(93,160,111,0.22)",
  textMuted:     "rgba(242,245,247,0.38)",
  textSub:       "rgba(242,245,247,0.55)",
  border:        "rgba(242,245,247,0.08)",
  borderHover:   "rgba(242,245,247,0.15)",
};

// ─── HERO STATE MAP ───────────────────────────────────────────────────────────
const HERO = {
  default: {
    tag: "VENTURE STUDIO · NATIONAL SECURITY",
    lines: ["Build what", "the mission", "demands."],
    accent: 2,
    body: "We co-found and build new ventures to solve urgent operational problems — with a relentless focus on Indo-Pacific deterrence.",
    pulse: null,
  },
  "Problem Solving": {
    tag: "PROBLEM DISCOVERY",
    lines: ["The best", "problems aren't", "in the RFP."],
    accent: 1,
    body: "We embed with operators before requirements are written — surfacing the problems worth solving before anyone else sees them.",
    pulse: "Signal: active",
  },
  "Transition": {
    tag: "TECHNOLOGY TRANSITION",
    lines: ["The valley", "of death", "is real."],
    accent: 2,
    body: "Most defense tech dies between prototype and program of record. Our transition engineering model was built for exactly that gap.",
    pulse: "TRL 4 → 7",
  },
  "Building": {
    tag: "CO-FOUNDING MODEL",
    lines: ["We don't", "advise.", "We co-build."],
    accent: 1,
    body: "We take on real risk alongside founders — bringing operator access, funding pathways, and a network that gets things done.",
    pulse: "Equity-aligned",
  },
  "Deploying Capability": {
    tag: "SPEED TO FIELDING",
    lines: ["Prototype", "to fielded", "capability."],
    accent: 2,
    body: "We know every shortcut through the acquisition process — and when to use them. Speed is a strategic advantage.",
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
    body: "From problem discovery to fielded capability — we operate across the entire arc of the mission.",
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
    body: "Most failed defense tech didn't fail at building — it failed at problem selection. We put operators in the room before day one.",
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
    body: "Defense Builders connects the people who see the problem with the people who can solve it — and gets them working in days.",
    pulse: "Prototype in 72hrs",
  },
  "I need to scale or transition": {
    tag: "TRANSITION ENGINEERING",
    lines: ["The valley", "of death", "ends here."],
    accent: 2,
    body: "We've navigated the transition gap more times than we can count. We know the pathways, the players, and the shortcuts that work.",
    pulse: "TRL 4 → 7",
  },
  "I'm deployed, optimizing": {
    tag: "SUSTAINMENT & SCALE",
    lines: ["Fielded.", "Funded.", "Growing."],
    accent: 0,
    body: "Once you're deployed, the work isn't done — it's different. We help you hold ground, expand access, and compound your advantage.",
    pulse: "Program of record",
  },
  contact_step: {
    tag: "ALMOST INSIDE",
    lines: ["One step", "from the", "network."],
    accent: 2,
    body: "You've identified what matters. We personally review every request — we're looking for builders who are serious about the mission.",
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
    tag: "PRODUCT · THE COMBINE",
    lines: ["Validate", "before you", "build wrong."],
    accent: 2,
    body: "Direct warfighter access to test funded DoD tech before a single production dollar is spent.",
    pulse: "Warfighter-validated",
  },
  "Defense Builders": {
    tag: "PRODUCT · DEFENSE BUILDERS",
    lines: ["Days,", "not years,", "to prototype."],
    accent: 0,
    body: "A marketplace pairing problem solvers with problem owners — tools, trust, and transactions in one place.",
    pulse: "Prototype in 72hrs",
  },
  "Wingman": {
    tag: "PRODUCT · WINGMAN",
    lines: ["Your device.", "Your data.", "Your edge."],
    accent: 1,
    body: "Turn any mobile device into a mission asset. Operationalize your inbox. Brief, don't bury.",
    pulse: "Local inference",
  },
  multi_products: {
    tag: "YOUR STARTING POINTS",
    lines: ["The full", "Merge", "arsenal."],
    accent: 1,
    body: "You're tapping into the complete stack — from problem validation to deployed capability in the hands of the warfighter.",
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

const JOURNEY_STAGES = [
  {
    id: "I have a problem to solve",
    icon: "◎",
    label: "I have a problem to solve",
    sub: "Looking for the right frame, the right people, or the right proof points",
  },
  {
    id: "I have a concept to validate",
    icon: "◈",
    label: "I have a concept to validate",
    sub: "Built something — need to know if real operators will actually use it",
  },
  {
    id: "I'm building a prototype",
    icon: "◉",
    label: "I'm building a prototype",
    sub: "Heads down on the build — need technical talent, partners, or infrastructure",
  },
  {
    id: "I need to scale or transition",
    icon: "⬡",
    label: "I need to scale or transition",
    sub: "Have a working system — struggling with the valley of death",
  },
  {
    id: "I'm deployed, optimizing",
    icon: "◇",
    label: "I'm deployed, optimizing",
    sub: "In the field, holding ground, looking to expand impact",
  },
];

const PRODUCTS = [
  {
    id: "The Combine",
    tag: "VALIDATION",
    label: "The Combine",
    desc: "Validate funded DoD tech directly with warfighters — before you build the wrong thing at scale.",
    icon: "⬡",
  },
  {
    id: "Defense Builders",
    tag: "MARKETPLACE",
    label: "Defense Builders",
    desc: "Connect problem solvers with problem owners. Build a working prototype in days, not months.",
    icon: "◈",
  },
  {
    id: "Wingman",
    tag: "MOBILE INTEL",
    label: "Wingman",
    desc: "Turn your mobile device into a mission asset. Your data. Your device. Your edge.",
    icon: "◉",
  },
];

// ─── HERO PANEL ───────────────────────────────────────────────────────────────
function HeroPanel({ heroKey }) {
  const [displayKey, setDisplayKey] = useState(heroKey);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (heroKey === displayKey) return;
    setVisible(false);
    const t = setTimeout(() => {
      setDisplayKey(heroKey);
      setVisible(true);
    }, 230);
    return () => clearTimeout(t);
  }, [heroKey, displayKey]);

  const h = HERO[displayKey] || HERO.default;

  return (
    <div style={{
      width: "42%", minWidth: 320,
      background: C.charcoal,
      borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      padding: "48px 40px", position: "relative", overflow: "hidden",
    }}>
      {/* Grid */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.035, pointerEvents: "none",
        backgroundImage: `linear-gradient(${C.offWhite} 1px,transparent 1px),linear-gradient(90deg,${C.offWhite} 1px,transparent 1px)`,
        backgroundSize: "36px 36px" }} />
      {/* Blue glow */}
      <div style={{ position: "absolute", top: -100, left: -100, width: 360, height: 360, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(42,127,219,0.14) 0%,transparent 70%)", pointerEvents: "none" }} />
      {/* Green glow */}
      <div style={{ position: "absolute", bottom: -80, right: -60, width: 260, height: 260, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(93,160,111,0.10) 0%,transparent 70%)", pointerEvents: "none" }} />
      {/* Left accent bar */}
      <div style={{ position: "absolute", left: 0, top: "15%", bottom: "15%", width: 3,
        background: C.signalBlue, borderRadius: "0 2px 2px 0", opacity: 0.7 }} />

      {/* Wordmark */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <div style={{ width: 30, height: 30, background: C.signalBlue, borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, color: C.white, fontWeight: 700,
            fontFamily: "'Helvetica Neue',Inter,sans-serif" }}>M</div>
          <span style={{ fontFamily: "'Space Mono','Courier New',monospace",
            fontSize: 11, color: C.textMuted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            MERGE COMBINATOR
          </span>
        </div>

        {/* Animated content */}
        <div style={{ transition: "opacity 0.22s ease, transform 0.22s ease",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)" }}>
          {/* Tag + pulse */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 22 }}>
            {h.pulse && (
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                background: C.operatorGreen, boxShadow: `0 0 8px ${C.operatorGreen}`,
                animation: "blink 2s ease-in-out infinite" }} />
            )}
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11,
              color: h.pulse ? C.operatorGreen : C.signalBlue,
              letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {h.tag}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Helvetica Neue',Inter,-apple-system,sans-serif",
            fontSize: 54, fontWeight: 700, lineHeight: 1.08, margin: "0 0 20px",
            color: C.white, letterSpacing: "-0.02em" }}>
            {h.lines.map((line, i) => (
              <span key={i} style={{ display: "block", color: i === h.accent ? C.signalBlue : C.white }}>
                {line}
              </span>
            ))}
          </h1>

          {/* Body */}
          <p style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
            fontSize: 15, fontWeight: 400, lineHeight: 1.65,
            color: C.textSub, margin: 0, maxWidth: 290 }}>
            {h.body}
          </p>

          {/* Pulse badge */}
          {h.pulse && (
            <div style={{ display: "inline-block", marginTop: 18, padding: "4px 10px",
              background: C.greenFaint, border: "1px solid rgba(93,160,111,0.3)",
              borderRadius: 3, fontFamily: "'Space Mono',monospace",
              fontSize: 10, color: C.operatorGreen, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {h.pulse}
            </div>
          )}
        </div>
      </div>

      {/* Stats footer */}
      <div style={{ position: "relative", zIndex: 1, borderTop: `1px solid ${C.border}`,
        paddingTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { n: "47+", l: "ventures co-founded" },
          { n: "Indo-Pac", l: "primary focus" },
          { n: "End-to-end", l: "build model" },
        ].map(s => (
          <div key={s.l}>
            <div style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
              fontSize: 17, fontWeight: 700, color: C.offWhite, marginBottom: 4 }}>{s.n}</div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9,
              color: C.textMuted, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.4 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROGRESS BAR (4 gated steps) ────────────────────────────────────────────
function ProgressBar({ step }) {
  return (
    <div style={{ display: "flex", gap: 5, marginBottom: 40 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ flex: 1, height: 2, borderRadius: 1,
          background: i <= step ? C.signalBlue : C.slate,
          transition: "background 0.35s ease" }} />
      ))}
    </div>
  );
}

// ─── STEP LABEL ───────────────────────────────────────────────────────────────
function StepLabel({ n, total, text }) {
  return (
    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11,
      color: C.signalBlue, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>
      {text} · {n} OF {total}
    </div>
  );
}

// ─── CHIP ─────────────────────────────────────────────────────────────────────
function Chip({ label, selected, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      background: selected ? C.blueFaint : "rgba(255,255,255,0.02)",
      border: `1px solid ${selected ? C.signalBlue : C.border}`,
      borderRadius: 4, padding: "10px 14px",
      fontFamily: "'Helvetica Neue',Inter,sans-serif",
      fontSize: 14, fontWeight: selected ? 500 : 400,
      color: selected ? C.signalBlue : C.textSub,
      cursor: "pointer", textAlign: "left", lineHeight: 1.4,
      transition: "all 0.15s ease", width: "100%",
    }}>{label}</button>
  );
}

// ─── NAV BUTTONS ─────────────────────────────────────────────────────────────
function NavButtons({ canContinue, onNext, onBack, nextLabel = "Continue →" }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={onBack} style={{
        padding: "13px 18px",
        background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
        borderRadius: 5, color: C.textSub,
        fontFamily: "'Helvetica Neue',Inter,sans-serif", fontSize: 14, cursor: "pointer",
      }}>← Back</button>
      <button onClick={onNext} disabled={!canContinue} style={{
        flex: 1, padding: "13px 0",
        background: canContinue ? C.signalBlue : C.slate,
        border: "none", borderRadius: 5,
        fontFamily: "'Helvetica Neue',Inter,sans-serif",
        fontSize: 15, fontWeight: 600,
        color: canContinue ? C.white : C.textMuted,
        cursor: canContinue ? "pointer" : "not-allowed",
        transition: "all 0.2s ease",
      }}>{nextLabel}</button>
    </div>
  );
}

// ─── STEP 1 — Areas ───────────────────────────────────────────────────────────
function Step1({ value, onChange, onNext }) {
  const canContinue = value.length > 0;
  const toggle = a => {
    const s = new Set(value);
    s.has(a) ? s.delete(a) : s.add(a);
    onChange([...s]);
  };

  return (
    <div style={{ animation: "stepIn 0.25s ease" }}>
      <StepLabel n={1} total={4} text="CONFIGURE YOUR ACCESS" />
      <h2 style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
        fontSize: 34, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em",
        color: C.offWhite, margin: "0 0 6px" }}>
        Which of these areas interest you?
      </h2>
      <p style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif", fontSize: 15,
        color: C.textMuted, lineHeight: 1.6, margin: "0 0 28px" }}>
        Select all that apply — we'll tailor what we show you.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 32 }}>
        {AREAS.map(a => <Chip key={a} label={a} selected={value.includes(a)} onToggle={() => toggle(a)} />)}
      </div>
      <button onClick={onNext} disabled={!canContinue} style={{
        width: "100%", padding: "14px 0",
        background: canContinue ? C.signalBlue : C.slate,
        border: "none", borderRadius: 5,
        fontFamily: "'Helvetica Neue',Inter,sans-serif",
        fontSize: 15, fontWeight: 600,
        color: canContinue ? C.white : C.textMuted,
        cursor: canContinue ? "pointer" : "not-allowed",
        transition: "all 0.2s ease",
      }}>Continue →</button>
    </div>
  );
}

// ─── STEP 2 — Values ──────────────────────────────────────────────────────────
function Step2({ value, onChange, onNext, onBack }) {
  const canContinue = value.length > 0;
  const toggle = v => {
    const s = new Set(value);
    s.has(v) ? s.delete(v) : s.add(v);
    onChange([...s]);
  };

  return (
    <div style={{ animation: "stepIn 0.25s ease" }}>
      <StepLabel n={2} total={4} text="CONFIGURE YOUR ACCESS" />
      <h2 style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
        fontSize: 34, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em",
        color: C.offWhite, margin: "0 0 6px" }}>
        What would you find most valuable?
      </h2>
      <p style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif", fontSize: 15,
        color: C.textMuted, lineHeight: 1.6, margin: "0 0 28px" }}>
        Merge Combinator empowers change agents to solve hard problems at scale.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 32 }}>
        {VALUE_ITEMS.map(v => <Chip key={v} label={v} selected={value.includes(v)} onToggle={() => toggle(v)} />)}
      </div>
      <NavButtons canContinue={canContinue} onNext={onNext} onBack={onBack} />
    </div>
  );
}

// ─── STEP 3 — Journey Stage (single-select) ──────────────────────────────────
function Step3({ value, onChange, onNext, onBack }) {
  const canContinue = !!value;

  return (
    <div style={{ animation: "stepIn 0.25s ease" }}>
      <StepLabel n={3} total={4} text="CONFIGURE YOUR ACCESS" />
      <h2 style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
        fontSize: 34, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em",
        color: C.offWhite, margin: "0 0 6px" }}>
        Where are you in the journey?
      </h2>
      <p style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif", fontSize: 15,
        color: C.textMuted, lineHeight: 1.6, margin: "0 0 28px" }}>
        Pick the one that best fits where you are right now.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
        {JOURNEY_STAGES.map(stage => {
          const sel = value === stage.id;
          return (
            <button key={stage.id} onClick={() => onChange(stage.id)} style={{
              background: sel ? C.blueFaint : "rgba(255,255,255,0.02)",
              border: `1px solid ${sel ? C.signalBlue : C.border}`,
              borderLeft: `3px solid ${sel ? C.signalBlue : "transparent"}`,
              borderRadius: 6, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 14,
              cursor: "pointer", textAlign: "left",
              transition: "all 0.15s ease", width: "100%",
            }}>
              <span style={{ fontSize: 18, color: sel ? C.signalBlue : "rgba(242,245,247,0.2)",
                width: 20, textAlign: "center", flexShrink: 0 }}>{stage.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
                  fontWeight: 600, fontSize: 14,
                  color: sel ? C.offWhite : C.textSub, marginBottom: 3 }}>
                  {stage.label}
                </div>
                <div style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
                  fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                  {stage.sub}
                </div>
              </div>
              {sel && (
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.signalBlue,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: C.white, fontWeight: 700, flexShrink: 0 }}>✓</div>
              )}
            </button>
          );
        })}
      </div>
      <NavButtons canContinue={canContinue} onNext={onNext} onBack={onBack} />
    </div>
  );
}

// ─── STEP 4 — Contact Form ────────────────────────────────────────────────────
function Step4({ formData, setFormData, onBack, onSubmit }) {
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const canSubmit = formData.name.trim() && formData.email.trim();

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setTimeout(onSubmit, 900);
  };

  return (
    <div style={{ animation: "stepIn 0.25s ease" }}>
      <StepLabel n={4} total={4} text="ALMOST INSIDE" />
      <h2 style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
        fontSize: 34, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em",
        color: C.offWhite, margin: "0 0 6px" }}>
        Tell us where to reach you.
      </h2>
      <p style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif", fontSize: 15,
        color: C.textMuted, lineHeight: 1.6, margin: "0 0 28px" }}>
        We personally review every request. Expect to hear back within 48 hours.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
        {[
          { key: "name", label: "NAME", placeholder: "Your full name", type: "text" },
          { key: "email", label: "EMAIL", placeholder: "your@organization.gov", type: "email" },
          { key: "org", label: "ORGANIZATION", placeholder: "Optional", type: "text" },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display: "block", fontFamily: "'Space Mono',monospace",
              fontSize: 11, color: C.textMuted, letterSpacing: "0.04em",
              textTransform: "uppercase", marginBottom: 7 }}>{f.label}</label>
            <input type={f.type} placeholder={f.placeholder}
              value={formData[f.key]}
              onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ width: "100%", padding: "12px 14px", background: C.charcoal,
                border: `1px solid ${focusedField === f.key ? "rgba(42,127,219,0.5)" : C.border}`,
                borderRadius: 5, color: C.offWhite,
                fontFamily: "'Helvetica Neue',Inter,sans-serif", fontSize: 15,
                outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
              onFocus={() => setFocusedField(f.key)}
              onBlur={() => setFocusedField(null)}
            />
          </div>
        ))}
      </div>
      <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
        width: "100%", padding: "14px 0", marginBottom: 12,
        background: canSubmit && !submitting ? C.signalBlue : C.slate,
        border: "none", borderRadius: 5,
        fontFamily: "'Helvetica Neue',Inter,sans-serif",
        fontSize: 15, fontWeight: 600,
        color: canSubmit && !submitting ? C.white : C.textMuted,
        cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
        transition: "all 0.2s ease",
      }}>{submitting ? "Submitting…" : "Request Access →"}</button>
      <button onClick={onBack} style={{ background: "none", border: "none",
        color: C.textMuted, fontSize: 13, cursor: "pointer",
        fontFamily: "'Helvetica Neue',Inter,sans-serif",
        padding: 0, marginBottom: 28, display: "block" }}>← Back</button>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
        <p style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
          fontSize: 13, color: C.textMuted, marginBottom: 10 }}>Already a member?</p>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/auth/login" style={{ flex: 1, padding: "10px 0", textAlign: "center",
            background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
            borderRadius: 5, color: C.textSub, textDecoration: "none",
            fontFamily: "'Helvetica Neue',Inter,sans-serif", fontSize: 13, cursor: "pointer" }}>
            Sign in with Email →
          </a>
          <a href="https://api.sigmablox.com/auth/sso/start?provider=google&returnTo=https://mergecombinator.com/"
            style={{ padding: "10px 16px",
              background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
              borderRadius: 5, color: C.textSub, textDecoration: "none",
              fontFamily: "'Helvetica Neue',Inter,sans-serif", fontSize: 13, cursor: "pointer" }}>
            Google
          </a>
          <div style={{ position: "relative" }}>
            <span style={{ display: "inline-block", padding: "10px 14px",
              background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 5, color: C.textMuted,
              fontFamily: "'Space Mono',monospace", fontSize: 10, cursor: "not-allowed",
              letterSpacing: "0.04em", textTransform: "uppercase" }}>CAC/PIV</span>
            <span style={{ position: "absolute", top: -8, right: -4,
              background: C.slate, border: `1px solid ${C.border}`,
              borderRadius: 2, padding: "1px 5px",
              fontFamily: "'Space Mono',monospace", fontSize: 8,
              color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 5 — Where to Start (post-submit) ───────────────────────────────────
function Step5({ value, onChange, onDone }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(t);
  }, []);

  const toggle = id => {
    const s = new Set(value);
    s.has(id) ? s.delete(id) : s.add(id);
    onChange([...s]);
  };

  return (
    <div style={{ opacity: revealed ? 1 : 0, transform: revealed ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.4s ease, transform 0.4s ease" }}>
      {/* Confirmed badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28,
        padding: "10px 14px",
        background: C.greenFaint,
        border: "1px solid rgba(93,160,111,0.25)",
        borderRadius: 5 }}>
        <span style={{ fontSize: 16, color: C.operatorGreen }}>✓</span>
        <div>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11,
            color: C.operatorGreen, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
            Request Submitted
          </div>
          <div style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
            fontSize: 12, color: C.textMuted }}>
            We'll review and reach out within 48 hours.
          </div>
        </div>
      </div>

      <h2 style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
        fontSize: 34, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em",
        color: C.offWhite, margin: "0 0 6px" }}>
        Where do you want to start?
      </h2>
      <p style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif", fontSize: 15,
        color: C.textMuted, lineHeight: 1.6, margin: "0 0 28px" }}>
        When your access is approved, we'll have the right doors open. Select any that interest you.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
        {PRODUCTS.map(p => {
          const sel = value.includes(p.id);
          return (
            <button key={p.id} onClick={() => toggle(p.id)} style={{
              background: sel ? C.greenFaint : "rgba(255,255,255,0.02)",
              border: `1px solid ${sel ? C.operatorGreen : C.border}`,
              borderLeft: `3px solid ${sel ? C.operatorGreen : "transparent"}`,
              borderRadius: 6, padding: "16px 18px",
              cursor: "pointer", textAlign: "left",
              transition: "all 0.15s ease", width: "100%",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 18, color: sel ? C.operatorGreen : C.textMuted }}>{p.icon}</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10,
                  color: sel ? C.operatorGreen : C.textMuted,
                  letterSpacing: "0.04em", textTransform: "uppercase" }}>{p.tag}</span>
                {sel && <span style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%",
                  background: C.operatorGreen, display: "inline-flex", alignItems: "center",
                  justifyContent: "center", fontSize: 10, color: "#000", fontWeight: 700 }}>✓</span>}
              </div>
              <div style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
                fontSize: 16, fontWeight: 600,
                color: sel ? C.offWhite : C.textSub, marginBottom: 4 }}>{p.label}</div>
              <div style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
                fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{p.desc}</div>
            </button>
          );
        })}
      </div>

      <button onClick={onDone} style={{
        width: "100%", padding: "14px 0",
        background: value.length > 0 ? C.operatorGreen : C.slate,
        border: "none", borderRadius: 5,
        fontFamily: "'Helvetica Neue',Inter,sans-serif",
        fontSize: 15, fontWeight: 600,
        color: value.length > 0 ? "#0B0E11" : C.textMuted,
        cursor: "pointer", transition: "all 0.2s ease",
      }}>
        {value.length > 0 ? "Save my preferences →" : "Skip for now →"}
      </button>
    </div>
  );
}

// ─── DONE SCREEN ──────────────────────────────────────────────────────────────
function DoneScreen({ products }) {
  const [reqId] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: 360, textAlign: "center",
      gap: 14, animation: "stepIn 0.4s ease" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%",
        background: C.greenFaint, border: "2px solid rgba(93,160,111,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, color: C.operatorGreen,
        animation: "pop 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>✓</div>
      <h2 style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
        fontSize: 32, fontWeight: 700, color: C.offWhite, margin: 0, letterSpacing: "-0.02em" }}>
        You're in the queue.
      </h2>
      <p style={{ fontFamily: "'Helvetica Neue',Inter,sans-serif",
        fontSize: 15, color: C.textMuted, maxWidth: 300, lineHeight: 1.6, margin: 0 }}>
        We'll review your application and reach out within 48 hours.
        {products.length > 0 && " We've noted your starting points."}
      </p>
      <div style={{ marginTop: 8, padding: "10px 20px",
        background: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 4,
        fontFamily: "'Space Mono',monospace", fontSize: 11,
        color: C.textMuted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        Request · {reqId}
      </div>
    </div>
  );
}

// ─── HERO KEY LOGIC ───────────────────────────────────────────────────────────
function getHeroKey(step, areas, values, journey, products) {
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

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function MCOnboarding() {
  const [step, setStep] = useState(1);
  const [areas, setAreas] = useState([]);
  const [values, setValues] = useState([]);
  const [journey, setJourney] = useState(null);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: "", email: "", org: "" });
  const [heroKey, setHeroKey] = useState("default");

  const advance = (nextStep, patch = {}) => {
    const a = patch.areas ?? areas;
    const v = patch.values ?? values;
    const j = patch.journey ?? journey;
    const p = patch.products ?? products;
    setHeroKey(getHeroKey(nextStep, a, v, j, p));
    setStep(nextStep);
  };

  const isDone = step === 6;

  return (
    <>
      <style>{`
        @keyframes stepIn{from{opacity:0;transform:translateX(16px);}to{opacity:1;transform:translateX(0);}}
        @keyframes pop{0%{transform:scale(0.6);opacity:0;}60%{transform:scale(1.12);}100%{transform:scale(1);opacity:1;}}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:0.3;}}
        #onboarding-root input::placeholder{color:rgba(242,245,247,0.2);}
        #onboarding-root input{caret-color:${C.signalBlue};}
        #onboarding-root button:focus-visible{outline:2px solid ${C.signalBlue};outline-offset:2px;}
        #onboarding-root ::-webkit-scrollbar{width:4px;}
        #onboarding-root ::-webkit-scrollbar-thumb{background:${C.slate};border-radius:4px;}
      `}</style>
      <div style={{ minHeight: "100vh", display: "flex",
        fontFamily: "'Helvetica Neue',Inter,-apple-system,sans-serif" }}>
        <HeroPanel heroKey={heroKey} />
        <div style={{ flex: 1, background: C.nearBlack,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "48px 52px", overflowY: "auto" }}>
          <div style={{ maxWidth: 480, width: "100%", margin: "0 auto" }}>
            {step <= 4 && <ProgressBar step={step} />}
            {step === 5 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10,
                  color: C.textMuted, letterSpacing: "0.04em", textTransform: "uppercase",
                  whiteSpace: "nowrap" }}>Your access is being reviewed</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
            )}
            {isDone ? (
              <DoneScreen products={products} />
            ) : step === 1 ? (
              <Step1 value={areas} onChange={setAreas}
                onNext={() => advance(2, { areas })} />
            ) : step === 2 ? (
              <Step2 value={values} onChange={setValues}
                onNext={() => advance(3, { values })}
                onBack={() => advance(1)} />
            ) : step === 3 ? (
              <Step3 value={journey} onChange={setJourney}
                onNext={() => advance(4, { journey })}
                onBack={() => advance(2)} />
            ) : step === 4 ? (
              <Step4 formData={formData} setFormData={setFormData}
                onBack={() => advance(3)}
                onSubmit={() => advance(5)} />
            ) : (
              <Step5 value={products} onChange={setProducts}
                onDone={() => advance(6, { products })} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
