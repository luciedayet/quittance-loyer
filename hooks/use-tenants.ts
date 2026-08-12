"use client"

import { useCallback, useSyncExternalStore } from "react"

import {
  createTenant,
  readTenants,
  writeTenants,
  type Tenant,
  type TenantCivility,
} from "@/lib/tenants"

const EMPTY_TENANTS: Tenant[] = []

const listeners = new Set<() => void>()

type SnapshotCache = {
  serialized: string
  tenants: Tenant[]
}

const snapshotCache = new Map<string, SnapshotCache>()

function emitTenantsChange() {
  listeners.forEach((listener) => listener())
}

function subscribeTenants(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getTenantsStorageKey(profileId: string): string {
  return `quittances.v1.tenants.${profileId}`
}

function getTenantsSnapshot(profileId: string): Tenant[] {
  if (typeof window === "undefined") {
    return EMPTY_TENANTS
  }

  const serialized =
    window.localStorage.getItem(getTenantsStorageKey(profileId)) ?? "[]"
  const cached = snapshotCache.get(profileId)

  if (cached && cached.serialized === serialized) {
    return cached.tenants
  }

  const tenants =
    serialized === "[]" && !window.localStorage.getItem(getTenantsStorageKey(profileId))
      ? EMPTY_TENANTS
      : readTenants(profileId)

  snapshotCache.set(profileId, { serialized, tenants })
  return tenants
}

function invalidateTenantsCache(profileId: string) {
  snapshotCache.delete(profileId)
}

function getIsLoadedSnapshot(): boolean {
  return typeof window !== "undefined"
}

function getIsLoadedServerSnapshot(): boolean {
  return false
}

type NewTenantInput = {
  civility: TenantCivility
  name: string
  rentAmount: number
  chargesAmount: number
}

export function useTenants(profileId: string) {
  const getSnapshot = useCallback(
    () => getTenantsSnapshot(profileId),
    [profileId],
  )

  const tenants = useSyncExternalStore(
    subscribeTenants,
    getSnapshot,
    () => EMPTY_TENANTS,
  )

  const isLoaded = useSyncExternalStore(
    subscribeTenants,
    getIsLoadedSnapshot,
    getIsLoadedServerSnapshot,
  )

  const persist = useCallback(
    (nextTenants: Tenant[]) => {
      writeTenants(profileId, nextTenants)
      invalidateTenantsCache(profileId)
      emitTenantsChange()
    },
    [profileId],
  )

  const addTenant = useCallback(
    (input: NewTenantInput) => {
      const tenant = createTenant(input)
      persist([tenant, ...tenants])
      return tenant
    },
    [persist, tenants],
  )

  const updateTenant = useCallback(
    (id: string, updates: Partial<Omit<Tenant, "id" | "createdAt">>) => {
      persist(
        tenants.map((tenant) =>
          tenant.id === id ? { ...tenant, ...updates } : tenant,
        ),
      )
    },
    [persist, tenants],
  )

  const removeTenant = useCallback(
    (id: string) => {
      persist(tenants.filter((tenant) => tenant.id !== id))
    },
    [persist, tenants],
  )

  return {
    tenants,
    isLoaded,
    addTenant,
    updateTenant,
    removeTenant,
  }
}
