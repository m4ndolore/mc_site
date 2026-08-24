// ─── Intel feed relevance ───────────────────────────────────────────────────
// Decides which RSS articles reach the Industry Intel feed.
//
// This was a single-substring allowlist (`DEFENSE_KEYWORDS.some(kw =>
// text.includes(kw))`). Three problems with that, all observed live:
//
//   1. Unbounded substrings collide. "itar" matched the ITAR inside
//      "mil-ITAR-y" on 14 of 77 live articles — zero were about ITAR. Worse,
//      "nato" is inside "news.ycomb-INATO-r.com": the official HN feed hides
//      that URL inside an href that tag-stripping removes, but any parser
//      change that keeps URLs would have silently turned the whole filter into
//      a pass-everything no-op.
//   2. One weak hit was enough. 28 of 77 survivors matched exactly one
//      keyword, mostly "ai " — letting through a bare Threads permalink, a
//      naked domain, and two app-store listings.
//   3. The AI vocabulary was "ai " and "artificial intelligence" and nothing
//      else. No llm, gpt, machine learning, model, agent — so real AI
//      reporting was dropped while noise rode in on "ai ".
//
// So: match on word boundaries, weight the terms, and require a score rather
// than a hit. The threshold is a parameter so it can be tuned per source and
// overridden by env without a redeploy.

/** A term worth 2 points: its presence alone is a strong signal. */
const CORE_TERMS = [
  // Defense establishment
  "defense", "defence", "military", "pentagon", "dod", "department of defense",
  "national security", "warfighter", "warfighting",
  // Agencies and programs
  "darpa", "diu", "afrl", "afwerx", "socom", "sofwerx", "sbir", "sttr",
  "space force", "ussf", "space command", "dhs", "homeland security",
  // Services
  "navy", "army", "air force", "marine corps", "coast guard",
  // Systems and effects. "drone" and "uas" sit here rather than in the
  // supporting list: for this audience an article about drones is on-topic on
  // that basis alone, and at supporting weight a drone story with no second
  // keyword ("Germany opens new drone security centre") scored 1 and was cut.
  "drone", "uas", "uav", "c-uas", "cuas", "counter-drone", "counter-uas",
  "unmanned", "missile", "munition", "electronic warfare", "sigint", "osint",
  "loitering munition",
  // Acquisition instruments
  "dfars", "cmmc", "itar", "other transaction", "middle tier acquisition",
  // Theatre
  "indo-pacific", "indopacom", "pacom", "centcom", "eucom", "northcom",
  // Security events. These are decisive on their own: an article about
  // malware or a breach is relevant to this audience even when it never says
  // "defense". Leaving them at supporting weight is what dropped
  // "Malware infects Android-based automotive head unit firmware".
  "malware", "ransomware", "zero-day", "supply chain attack", "data breach",
  "credential leak", "nation-state actor",
  // AI substance. The old list had "ai " and "artificial intelligence" only,
  // so LLM and agent reporting was invisible to it.
  "llm", "large language model", "artificial intelligence",
  "machine learning", "foundation model",
];

/** A term worth 1 point: relevant in context, ambiguous on its own. */
const SUPPORTING_TERMS = [
  // AI and autonomy. The decisive terms (llm, machine learning, …) are core;
  // these are the ones that need corroboration.
  "ai", "gpt", "neural network", "transformer", "inference", "model training",
  "agentic", "autonomy", "autonomous", "computer vision", "copilot",
  // Uncrewed (the decisive terms are core; these need corroboration)
  "quadcopter", "swarm", "fpv", "counter-swarm",
  // Cyber. The decisive events (malware, ransomware, zero-day, …) are core.
  // "cybersecurity" is spelled out rather than relying on a "cyber" prefix
  // match: the boundary anchor deliberately does not do prefix matching, or
  // "far" would match "farm" again.
  "cyber", "cybersecurity", "cyberattack", "cyber attack", "infosec",
  "vulnerability", "exploit", "breach", "credential", "intrusion",
  "phishing", "botnet", "hacker", "threat actor", "security researcher",
  // Space. "space" alone is broad ("space heater", "office space") but in
  // combination with anything else it is almost always orbital/launch
  // reporting, and scoring means it cannot carry an article on its own.
  "space", "satellite", "orbital", "launch vehicle", "constellation",
  "spaceport", "reusable rocket",
  // Acquisition and policy
  "acquisition", "procurement", "contracting", "solicitation", "rfp", "rfi",
  "appropriation", "authorization", "ndaa", "congress", "policy", "clearance",
  "classified", "biometric", "small business",
  // Signals and sensing
  "radar", "spectrum", "gps", "pnt", "jamming", "sensor",
  // Sustainment
  "logistics", "supply chain", "readiness", "sustainment", "maintenance",
  // Geopolitics. Adjectival forms matter as much as the country name — the
  // story is usually "Chinese hackers", not "China".
  "ukraine", "ukrainian", "china", "chinese", "russia", "russian",
  "taiwan", "taiwanese", "iran", "iranian", "north korea", "nato",
  // Community
  "veterans", "veterans affairs", "intelligence", "service members",
  "active duty", "active-duty",
];

/**
 * Acronyms and short words that MUST match on a word boundary. Substring
 * matching on these is what produced the military/ITAR and ycombinator/NATO
 * collisions. Any term of four characters or fewer is treated this way.
 */
const SHORT_TERM_MAX_LENGTH = 4;

export interface RelevanceResult {
  score: number;
  matched: string[];
  relevant: boolean;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Build a matcher for one term. Short terms and acronyms require word
 * boundaries; longer multi-word phrases are unambiguous enough for a plain
 * substring test, which is also much cheaper.
 */
function makeMatcher(term: string): (text: string) => boolean {
  // Multi-word phrases are unambiguous enough for a plain substring test, but
  // they still need to tolerate a hyphen where the source wrote a space
  // ("supply-chain attack" vs "supply chain attack").
  const separator = "[\\s-]+";
  const body = term.split(/\s+/).map(escapeRegExp).join(separator);
  // Allow a trailing plural/possessive: "llm" must match "LLMs", "credential"
  // must match "credentials". Without this the boundary anchor rejects them.
  const suffix = "(?:'?s)?";
  // \b does not treat "-" as a word character, so "c-uas" would break at the
  // hyphen. Anchor on non-alphanumeric instead.
  const pattern = new RegExp(`(^|[^a-z0-9])${body}${suffix}([^a-z0-9]|$)`, "i");
  return (text: string) => pattern.test(text);
}

const CORE_MATCHERS = CORE_TERMS.map((term) => ({ term, test: makeMatcher(term) }));
const SUPPORTING_MATCHERS = SUPPORTING_TERMS.map((term) => ({ term, test: makeMatcher(term) }));

/**
 * Titles that are structurally junk regardless of what they mention: bare
 * domains, app-store listings, social permalinks. These rode in on a single
 * weak keyword hit.
 */
const JUNK_TITLE_PATTERNS = [
  /^[a-z0-9-]+\.(com|org|net|io|ai|dev|gov|edu)\/?$/i, // naked domain
  /\s[-–]\s(apps on google play|app store)$/i,          // app-store listing
  /\bon threads$/i,                                      // social permalink
  /^@[a-z0-9_]+$/i,                                      // bare handle
];

export function isJunkTitle(title: string): boolean {
  const trimmed = title.trim();
  if (!trimmed) return true;
  return JUNK_TITLE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Strip URLs before matching. A URL is not editorial content, and leaving it
 * in is what makes "news.ycombinator.com" look like a NATO article.
 */
export function stripUrls(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\b[a-z0-9-]+\.(com|org|net|io|ai|dev|gov|edu)\b\S*/gi, " ");
}

/**
 * Score an article. `threshold` is the minimum score to be considered
 * relevant — 2 means "one core term, or two supporting terms", which is what
 * removes the single-weak-hit survivors.
 */
export function scoreRelevance(
  title: string,
  excerpt: string,
  threshold = 2,
): RelevanceResult {
  const text = stripUrls(`${title} ${excerpt}`).toLowerCase();
  const matched: string[] = [];
  let score = 0;

  for (const { term, test } of CORE_MATCHERS) {
    if (test(text)) {
      score += 2;
      matched.push(term);
    }
  }
  for (const { term, test } of SUPPORTING_MATCHERS) {
    if (test(text)) {
      score += 1;
      matched.push(term);
    }
  }

  return { score, matched, relevant: score >= threshold && !isJunkTitle(title) };
}

/**
 * Hacker News' RSS <description> is a single link whose visible text is
 * "Comments", so after tag-stripping every HN excerpt is the literal string
 * "Comments" — 8 characters, no information. An article whose excerpt is
 * empty after this has a title and nothing else.
 */
export function isEmptyExcerpt(excerpt: string): boolean {
  const normalized = excerpt.trim().toLowerCase();
  return normalized === "" || normalized === "comments" || normalized === "comment";
}

/**
 * Per-source relevance thresholds.
 *
 * ExecutiveGov is defense trade press: everything it publishes is on-topic, and
 * it is passed through unfiltered (10/10 on-topic in the live sample).
 *
 * Irregulars is human-curated defense OSINT, so a low bar is right — but it
 * was also the source of essentially every false positive, all riding in on
 * "ai ", so it still gets scored.
 *
 * Hacker News is filtered on titles alone (see isEmptyExcerpt), so a single
 * weak hit against ~8 words is not enough evidence.
 */
export const SOURCE_THRESHOLDS: Record<string, number> = {
  irregulars: 2,
  hackernews: 3,
};

export const DEFAULT_THRESHOLD = 2;

/**
 * Decode the HTML entities that survive tag-stripping. The previous pass
 * handled `&#039;` and decimal `&#NN;` but not hex (`&#x27;`) or named
 * (`&apos;`), so 9 of 77 live titles rendered as
 * "Anthropic&#x27;s best AI model…".
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  "#39": "'", "#039": "'",
};

export function decodeEntities(value: string): string {
  return value
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#39|#039);/g, (full, name: string) =>
      NAMED_ENTITIES[name] ?? full)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}
