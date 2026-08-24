// Intel filter regression tests.
//
// Run: npx tsx src/__tests__/intel-filter.test.mjs
//
// Every case here is drawn from live feed output — the collisions, the false
// negatives, and the junk that survived the previous substring filter.

import {
  scoreRelevance,
  isJunkTitle,
  isEmptyExcerpt,
  decodeEntities,
} from "../intel-filter";

let pass = 0;
let fail = 0;
const t = (name, cond, extra = "") => {
  if (cond) pass++;
  else {
    fail++;
    console.log("FAIL:", name, extra);
  }
};

// ── Substring collisions ────────────────────────────────────────────────────
// "itar" inside "military" matched 14 of 77 live articles; "nato" inside
// "news.ycombinator.com" matched 35 of 35 on an alternate HN feed.
t(
  "military does not match itar",
  !scoreRelevance("US military readiness review", "").matched.includes("itar"),
);
t(
  "ycombinator.com does not match nato",
  !scoreRelevance("Some post", "Comments URL: https://news.ycombinator.com/item?id=1")
    .matched.includes("nato"),
);
t(
  "real NATO article matches",
  scoreRelevance("NATO expands air defense posture", "").matched.includes("nato"),
);
t(
  "real ITAR article matches",
  scoreRelevance("ITAR reform proposed for space parts", "").matched.includes("itar"),
);
t(
  "c-uas matches across its hyphen",
  scoreRelevance("New C-UAS system fielded", "").matched.includes("c-uas"),
);

// ── False negatives the old vocabulary dropped ──────────────────────────────
t(
  "LLM article",
  scoreRelevance("If I were 17, I would learn how to build LLMs from scratch", "").relevant,
);
t(
  "malware article",
  scoreRelevance("Malware infects Android-based automotive head unit firmware", "").relevant,
);
t(
  "supply-chain leak",
  scoreRelevance("Terabytes of credentials leaked in massive supply-chain attack", "").relevant,
);
t(
  "cybersecurity spelled out",
  scoreRelevance(
    "T-Mobile chopped a cable to expel Chinese hackers from its network",
    "Bloomberg reported that T-Mobile cybersecurity staff expelled Chinese hackers",
  ).relevant,
);
t(
  "drone story with no second keyword",
  scoreRelevance("Germany opens new drone security centre amid rising threats", "").relevant,
);
t(
  "veterans program",
  scoreRelevance(
    "VET TEC 2.0 (high-tech program) | Veterans Affairs",
    "VET TEC 2.0 is a VA program that helps eligible Veterans and active-duty service members",
  ).relevant,
);

// ── Junk that rode in on a single weak hit ──────────────────────────────────
t("bare domain", isJunkTitle("aryaos.org"));
t("app store listing", isJunkTitle("Sentinel - Apps on Google Play"));
t("social permalink", isJunkTitle("Andy Cheng (@firerock31) on Threads"));
t(
  "batman reference",
  !scoreRelevance(
    "Remember when Batman turned everyone's phone into a sonar camera in The Dark Knight?",
    "",
  ).relevant,
);

// ── Genuine noise stays out ─────────────────────────────────────────────────
t("retro computing", !scoreRelevance("Kodak DC50 now usable on the Apple II", "").relevant);
t("css units", !scoreRelevance("Death to px, long live ch", "").relevant);
t("homelab", !scoreRelevance("Migrating a Synology NAS to a UniFi UNAS Pro 8", "").relevant);

// ── Real defense content stays in ───────────────────────────────────────────
t("DIU program", scoreRelevance("Defense Innovation Unit Unveils Bridge Program", "").relevant);
t(
  "space policy",
  scoreRelevance("White House Issues National Space Transportation Policy", "").relevant,
);
t(
  "DHS biometrics",
  scoreRelevance(
    "DHS Builds 2 Systems to Address Biometric Identity Verification Challenges",
    "",
  ).relevant,
);

// ── HN's empty excerpt ──────────────────────────────────────────────────────
t("Comments is empty", isEmptyExcerpt("Comments"));
t("real excerpt is not", !isEmptyExcerpt("The article argues that the biggest danger"));

// ── Entity decoding ─────────────────────────────────────────────────────────
for (const [input, expected] of [
  ["Anthropic&#x27;s best AI model", "Anthropic's best AI model"],
  ["year&apos;s end", "year's end"],
  ["China&apos;s space program", "China's space program"],
  ["AT&amp;T deal", "AT&T deal"],
  ["a &lt;tag&gt; here", "a <tag> here"],
  ["&quot;quoted&quot;", '"quoted"'],
  ["Don&#039;t", "Don't"],
  ["caf&#233;", "café"],
  // &amp; must decode last, or this double-decodes into a real tag.
  ["&amp;lt;not-a-tag&amp;gt;", "&lt;not-a-tag&gt;"],
]) {
  const got = decodeEntities(input);
  t(`decode ${JSON.stringify(input)}`, got === expected, `got ${JSON.stringify(got)}`);
}

console.log(`\npass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
