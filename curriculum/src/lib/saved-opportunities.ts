import { useCallback, useEffect, useMemo, useState } from "react";
import type { Opportunity } from "../types/opportunity";

const STORAGE_KEY = "mc-saved-opportunities-v1";

function getOpportunityKey(opportunity: Opportunity): string {
  return opportunity.id || opportunity.topicId;
}

function loadSavedOpportunities(): Opportunity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSavedOpportunities(items: Opportunity[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota or browser privacy errors.
  }
}

export function useSavedOpportunities() {
  const [saved, setSaved] = useState<Opportunity[]>(() => loadSavedOpportunities());

  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key === STORAGE_KEY) {
        setSaved(loadSavedOpportunities());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const savedKeys = useMemo(() => {
    return new Set(saved.map((item) => getOpportunityKey(item)));
  }, [saved]);

  const isSaved = useCallback(
    (opportunity: Opportunity): boolean => savedKeys.has(getOpportunityKey(opportunity)),
    [savedKeys],
  );

  const toggleSaved = useCallback((opportunity: Opportunity): void => {
    setSaved((current) => {
      const key = getOpportunityKey(opportunity);
      const next = current.some((item) => getOpportunityKey(item) === key)
        ? current.filter((item) => getOpportunityKey(item) !== key)
        : [opportunity, ...current];
      persistSavedOpportunities(next);
      return next;
    });
  }, []);

  const clearSaved = useCallback((): void => {
    persistSavedOpportunities([]);
    setSaved([]);
  }, []);

  return {
    saved,
    savedCount: saved.length,
    isSaved,
    toggleSaved,
    clearSaved,
  };
}
