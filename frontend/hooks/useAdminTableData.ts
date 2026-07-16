import { useState, useEffect, useCallback } from "react";
import { useAdminCache } from "@/context/AdminCacheContext";

export function useAdminTableData<T>(
  cacheKey: string,
  fetchFn: () => Promise<{ success: boolean; data?: T; error?: string }>
) {
  const { getCache, setCache, invalidateCache, setRevalidating, revalidatingKeys } = useAdminCache();

  const cachedData = getCache<T>(cacheKey);
  const [data, setData] = useState<T | null>(cachedData);
  const [loading, setLoading] = useState<boolean>(!cachedData);
  const isRevalidating = revalidatingKeys.has(cacheKey);

  const executeFetch = useCallback(
    async (showLoadingSpinner = false) => {
      if (showLoadingSpinner) {
        setLoading(true);
      } else {
        setRevalidating(cacheKey, true);
      }

      try {
        const result = await fetchFn();
        if (result.success && result.data !== undefined) {
          setData(result.data);
          setCache(cacheKey, result.data);
        }
      } catch (err) {
        console.error(`[useAdminTableData:${cacheKey}]`, err);
      } finally {
        setLoading(false);
        setRevalidating(cacheKey, false);
      }
    },
    [cacheKey, fetchFn, setCache, setRevalidating]
  );

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      executeFetch(false);
    } else {
      executeFetch(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const refreshData = useCallback(() => {
    return executeFetch(false);
  }, [executeFetch]);

  const invalidate = useCallback(() => {
    invalidateCache(cacheKey);
  }, [invalidateCache, cacheKey]);

  return {
    data,
    setData,
    loading,
    isRevalidating,
    refreshData,
    invalidate,
  };
}
