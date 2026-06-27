import { useState, useEffect } from "react";

export interface UserProgress {
  funderId?: string;
  currentStage: number;
  completedResources: Record<string, boolean>;
  timeSpentByStage: Record<string, number>;
  lastUpdated: string;
}

interface UseProgressReturn {
  progress: UserProgress | null;
  loading: boolean;
  error?: Error;
  updateProgress: (updates: Partial<UserProgress>) => Promise<void>;
}

const STORAGE_KEY = "curriculum-progress";

export function useProgress(funderId?: string): UseProgressReturn {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        let data: UserProgress;

        if (funderId) {
          const response = await fetch(`/api/curriculum/user-progress?funderId=${funderId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch progress: ${response.statusText}`);
          }
          data = await response.json() as UserProgress;
        } else {
          const stored = localStorage.getItem(STORAGE_KEY);
          data = stored
            ? (JSON.parse(stored) as UserProgress)
            : {
                currentStage: 1,
                completedResources: {},
                timeSpentByStage: {},
                lastUpdated: new Date().toISOString(),
              };
        }

        setProgress(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [funderId]);

  const updateProgress = async (updates: Partial<UserProgress>) => {
    if (!progress) return;

    const updated: UserProgress = {
      ...progress,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    try {
      if (funderId) {
        const response = await fetch("/api/curriculum/user-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (!response.ok) {
          throw new Error(`Failed to update progress: ${response.statusText}`);
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      setProgress(updated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    }
  };

  return { progress, loading, error, updateProgress };
}
