import { useState, useEffect } from "react";

export interface Resource {
  id: string;
  title: string;
  description?: string;
  url?: string;
  type: "read" | "watch" | "deep-dive" | "explore";
  duration?: string;
  thumbnail?: string;
}

export interface Stage {
  id: string;
  number: number;
  title: string;
  description: string;
  resources: {
    read: Resource[];
    watch: Resource[];
    deepDive: Resource[];
    explore: Resource[];
  };
  unlockCriteria?: {
    resourcesRequired: number;
    timeMinutes?: number;
  };
}

export interface CurriculumData {
  id: string;
  title: string;
  description: string;
  totalStages: number;
  stages: Stage[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    version: string;
  };
}

interface UseCurriculumReturn {
  curriculum: CurriculumData | null;
  loading: boolean;
  error?: Error;
}

export function useCurriculum(): UseCurriculumReturn {
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        setLoading(true);
        const response = await fetch("/data/curriculum.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch curriculum: ${response.statusText}`);
        }
        const data = await response.json() as CurriculumData;
        setCurriculum(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculum();
  }, []);

  return { curriculum, loading, error };
}
