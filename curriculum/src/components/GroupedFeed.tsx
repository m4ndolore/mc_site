import { useState, useMemo } from "react";
import type { Opportunity } from "../types/opportunity";
import type { OpportunityProfile } from "../types/profile";
import OpportunityCard from "./OpportunityCard";

interface GroupedFeedProps {
  opportunities: Opportunity[];
  groupBy: "component" | "problemArea";
  profile: OpportunityProfile;
  onSelectOpportunity: (opp: Opportunity) => void;
  onToggleSave: (opp: Opportunity) => void;
  isSaved: (id: string) => boolean;
}

interface Group {
  name: string;
  opportunities: Opportunity[];
}

/** Compute how many profile terms (techAreas + problemAreas) an opportunity matches. */
function computeMatchCount(opp: Opportunity, profile: OpportunityProfile): number {
  const oppTerms = [
    ...(opp.technologyAreas ?? []),
    ...(opp.focusAreas ?? []),
    ...(opp.keywords ?? []),
  ].map((t) => t.toLowerCase());

  const profileTerms = [...profile.techAreas, ...profile.problemAreas];
  let count = 0;
  for (const term of profileTerms) {
    const lower = term.toLowerCase();
    if (oppTerms.some((ot) => ot.includes(lower) || lower.includes(ot))) {
      count++;
    }
  }
  return count;
}

/** Sort opportunities: soonest deadline first, no-deadline last. */
function sortByDeadline(opps: Opportunity[]): Opportunity[] {
  return [...opps].sort((a, b) => {
    const da = a.responseDeadline ?? a.closeDate;
    const db = b.responseDeadline ?? b.closeDate;
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return new Date(da).getTime() - new Date(db).getTime();
  });
}

function groupByComponent(opportunities: Opportunity[]): Group[] {
  const map = new Map<string, Opportunity[]>();
  for (const opp of opportunities) {
    const key = opp.component || "Unknown";
    const list = map.get(key);
    if (list) {
      list.push(opp);
    } else {
      map.set(key, [opp]);
    }
  }
  return Array.from(map.entries())
    .map(([name, opps]) => ({ name, opportunities: sortByDeadline(opps) }))
    .sort((a, b) => b.opportunities.length - a.opportunities.length);
}

function groupByProblemArea(
  opportunities: Opportunity[],
  problemAreas: string[],
): Group[] {
  const map = new Map<string, Opportunity[]>();
  const matched = new Set<string>();

  for (const area of problemAreas) {
    map.set(area, []);
  }

  for (const opp of opportunities) {
    const oppTerms = [
      ...(opp.technologyAreas ?? []),
      ...(opp.focusAreas ?? []),
      ...(opp.keywords ?? []),
    ].map((t) => t.toLowerCase());

    let didMatch = false;
    for (const area of problemAreas) {
      const areaLower = area.toLowerCase();
      if (oppTerms.some((ot) => ot.includes(areaLower) || areaLower.includes(ot))) {
        map.get(area)!.push(opp);
        didMatch = true;
      }
    }
    const oppId = opp.id || opp.topicId;
    if (didMatch) {
      matched.add(oppId);
    }
  }

  // Collect unmatched into "Other"
  const other = opportunities.filter((opp) => !matched.has(opp.id || opp.topicId));
  if (other.length > 0) {
    map.set("Other", other);
  }

  // Remove empty groups, sort by deadline within, sort groups by count
  return Array.from(map.entries())
    .filter(([, opps]) => opps.length > 0)
    .map(([name, opps]) => ({ name, opportunities: sortByDeadline(opps) }))
    .sort((a, b) => {
      // "Other" always last
      if (a.name === "Other") return 1;
      if (b.name === "Other") return -1;
      return b.opportunities.length - a.opportunities.length;
    });
}

function GroupedFeed({
  opportunities,
  groupBy,
  profile,
  onSelectOpportunity,
  onToggleSave,
  isSaved,
}: GroupedFeedProps): React.JSX.Element {
  const groups = useMemo(() => {
    if (groupBy === "component") {
      return groupByComponent(opportunities);
    }
    return groupByProblemArea(opportunities, profile.problemAreas);
  }, [opportunities, groupBy, profile.problemAreas]);

  // All groups start expanded — track collapsed set
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  if (opportunities.length === 0) {
    return (
      <>
        <style>{gfeedStyles}</style>
        <div className="gfeed-empty">
          No opportunities found matching your profile.
        </div>
      </>
    );
  }

  return (
    <>
      <style>{gfeedStyles}</style>
      <div className="gfeed">
        {groups.map((group) => {
          const isOpen = !collapsed.has(group.name);
          return (
            <section key={group.name} className="gfeed-section">
              <button
                type="button"
                className="gfeed-header"
                onClick={() => toggle(group.name)}
                aria-expanded={isOpen}
              >
                <span className="gfeed-header__name">{group.name}</span>
                <span className="gfeed-header__right">
                  <span className="gfeed-header__count">
                    {group.opportunities.length}{" "}
                    {group.opportunities.length === 1 ? "opportunity" : "opportunities"}
                  </span>
                  <span
                    className={`gfeed-header__chevron${isOpen ? " gfeed-header__chevron--open" : ""}`}
                    aria-hidden="true"
                  >
                    &#x25B8;
                  </span>
                </span>
              </button>
              {isOpen && (
                <div className="gfeed-grid">
                  {group.opportunities.map((opp) => (
                    <OpportunityCard
                      key={opp.id || opp.topicId}
                      opportunity={opp}
                      onClick={onSelectOpportunity}
                      onToggleSave={onToggleSave}
                      isSaved={isSaved(opp.id || opp.topicId)}
                      matchCount={computeMatchCount(opp, profile)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

const gfeedStyles = `
  .gfeed {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .gfeed-empty {
    text-align: center;
    padding: 4rem 1rem;
    color: var(--gray-medium);
    font-size: 0.875rem;
  }
  .gfeed-section {
    border-bottom: 1px solid var(--ghost-gray);
  }
  .gfeed-section:last-child {
    border-bottom: none;
  }
  .gfeed-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--charcoal);
    border: none;
    border-radius: 2px;
    cursor: pointer;
    transition: background 150ms ease;
  }
  .gfeed-header:hover {
    background: color-mix(in srgb, var(--charcoal) 85%, white);
  }
  .gfeed-header__name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--offwhite);
  }
  .gfeed-header__right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .gfeed-header__count {
    font-size: 0.75rem;
    color: var(--gray-light);
  }
  .gfeed-header__chevron {
    font-size: 1.25rem;
    color: var(--gray-light);
    transition: transform 150ms ease;
    display: inline-block;
  }
  .gfeed-header__chevron--open {
    transform: rotate(90deg);
  }
  .gfeed-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
    padding: 1rem 0;
  }
  @media (min-width: 640px) {
    .gfeed-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1024px) {
    .gfeed-grid { grid-template-columns: repeat(3, 1fr); }
  }
`;

export default GroupedFeed;
