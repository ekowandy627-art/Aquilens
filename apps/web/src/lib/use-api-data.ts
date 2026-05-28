"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type UseApiDataOptions<T> = {
  initialData?: T;
};

type UseApiDataResult<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useApiData<T>(
  path: string,
  options: UseApiDataOptions<T>,
): UseApiDataResult<T> {
  const { initialData } = options;
  const hasInitialData = initialData !== undefined;
  const [data, setData] = useState<T>(
    () => (initialData ?? null) as T,
  );
  const [loading, setLoading] = useState(!hasInitialData);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await apiFetch<T>(path);
      setData(next);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load data.",
      );
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    window.setTimeout(() => {
      void load();
    }, 0);
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}
