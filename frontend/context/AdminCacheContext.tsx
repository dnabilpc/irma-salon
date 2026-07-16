"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

interface AdminCacheContextType {
  getCache: <T>(key: string) => T | null;
  setCache: <T>(key: string, data: T) => void;
  invalidateCache: (key: string) => void;
  invalidateAll: () => void;
  revalidatingKeys: Set<string>;
  setRevalidating: (key: string, isRevalidating: boolean) => void;
}

const AdminCacheContext = createContext<AdminCacheContextType | undefined>(undefined);

export function AdminCacheProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Record<string, CacheEntry>>({});
  const [revalidatingKeys, setRevalidatingKeys] = useState<Set<string>>(new Set());

  const getCache = useCallback(<T,>(key: string): T | null => {
    return (store[key]?.data as T) ?? null;
  }, [store]);

  const setCache = useCallback(<T,>(key: string, data: T) => {
    setStore((prev) => ({
      ...prev,
      [key]: { data, timestamp: Date.now() },
    }));
  }, []);

  const invalidateCache = useCallback((key: string) => {
    setStore((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  }, []);

  const invalidateAll = useCallback(() => {
    setStore({});
  }, []);

  const setRevalidating = useCallback((key: string, isRevalidating: boolean) => {
    setRevalidatingKeys((prev) => {
      const next = new Set(prev);
      if (isRevalidating) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  return (
    <AdminCacheContext.Provider
      value={{ getCache, setCache, invalidateCache, invalidateAll, revalidatingKeys, setRevalidating }}
    >
      {children}
    </AdminCacheContext.Provider>
  );
}

export function useAdminCache() {
  const ctx = useContext(AdminCacheContext);
  if (!ctx) {
    throw new Error("useAdminCache must be used within AdminCacheProvider");
  }
  return ctx;
}
