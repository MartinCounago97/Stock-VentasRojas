"use client";

import { useEffect, useSyncExternalStore } from "react";
import { store } from "@/lib/store";
import type { Product, Movement, Sector, AppSettings } from "@/lib/store";

export function useProducts(): Product[] {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getProducts,
    store.getProducts
  );

  useEffect(() => {
    store.hydrateFromApi();
  }, []);

  return snapshot;
}

export function useMovements(): Movement[] {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getMovements,
    store.getMovements
  );

  useEffect(() => {
    store.hydrateFromApi();
  }, []);

  return snapshot;
}

export function useSectors(): Sector[] {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSectors,
    store.getSectors
  );

  useEffect(() => {
    store.hydrateFromApi();
  }, []);

  return snapshot;
}

export function useSettings(): AppSettings {
  return useSyncExternalStore(
    store.subscribe,
    store.getSettings,
    store.getSettings
  );
}
