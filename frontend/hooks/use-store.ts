"use client"

import { useSyncExternalStore } from "react"
import { store } from "@/lib/store"

export function useProducts() {
  return useSyncExternalStore(
    store.subscribe,
    store.getProducts,
    store.getProducts
  )
}

export function useMovements() {
  return useSyncExternalStore(
    store.subscribe,
    store.getMovements,
    store.getMovements
  )
}

export function useSales() {
  return useSyncExternalStore(
    store.subscribe,
    store.getSales,
    store.getSales
  )
}

export function useSettings() {
  return useSyncExternalStore(
    store.subscribe,
    store.getSettings,
    store.getSettings
  )
}

export function useSectors() {
  return useSyncExternalStore(
    store.subscribe,
    store.getSectors,
    store.getSectors
  )
}

export function usePreSales() {
  return useSyncExternalStore(
    store.subscribe,
    store.getPreSales,
    store.getPreSales
  )
}
