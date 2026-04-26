import { useCallback, useEffect, useState } from "react";
import type { OpportunityProfile, ViewMode } from "../types/profile";

const STORAGE_KEY = "mc-opportunity-profile-v1";
const OLD_SAVED_KEY = "mc-saved-opportunities-v1";

function migrateSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OLD_SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const ids = parsed
      .map((item: { id?: string }) => item.id)
      .filter((id): id is string => typeof id === "string");
    window.localStorage.removeItem(OLD_SAVED_KEY);
    return ids;
  } catch {
    return [];
  }
}

function loadProfile(): OpportunityProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OpportunityProfile;
  } catch {
    return null;
  }
}

function persistProfile(profile: OpportunityProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota or browser privacy errors.
  }
}

function removeProfile(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<OpportunityProfile | null>(() => loadProfile());

  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key === STORAGE_KEY) {
        setProfile(loadProfile());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const createProfile = useCallback(
    (techAreas: string[], problemAreas: string[], viewMode: ViewMode): void => {
      const migratedIds = migrateSavedIds();
      const now = new Date().toISOString();
      const next: OpportunityProfile = {
        techAreas,
        problemAreas,
        viewMode,
        savedIds: migratedIds,
        createdAt: now,
        updatedAt: now,
      };
      persistProfile(next);
      setProfile(next);
    },
    [],
  );

  const updateProfile = useCallback(
    (updates: Partial<Pick<OpportunityProfile, "techAreas" | "problemAreas" | "viewMode">>): void => {
      setProfile((current) => {
        if (!current) return current;
        const next: OpportunityProfile = {
          ...current,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        persistProfile(next);
        return next;
      });
    },
    [],
  );

  const clearProfile = useCallback((): void => {
    removeProfile();
    setProfile(null);
  }, []);

  const toggleSavedId = useCallback((id: string): void => {
    setProfile((current) => {
      if (!current) return current;
      const exists = current.savedIds.includes(id);
      const next: OpportunityProfile = {
        ...current,
        savedIds: exists
          ? current.savedIds.filter((s) => s !== id)
          : [id, ...current.savedIds],
        updatedAt: new Date().toISOString(),
      };
      persistProfile(next);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (id: string): boolean => profile?.savedIds.includes(id) ?? false,
    [profile],
  );

  return {
    profile,
    hasProfile: profile !== null,
    createProfile,
    updateProfile,
    clearProfile,
    toggleSavedId,
    isSaved,
  };
}
