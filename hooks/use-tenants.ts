"use client"

import { useCallback, useEffect, useState } from "react"

import type { Tenant, TenantCivility } from "@/lib/tenants"

type NewTenantInput = {
  civility: TenantCivility
  name: string
  rentAmount: number
  chargesAmount: number
  firstQuittanceDate?: string | null
  lastQuittanceDate?: string | null
  location?: string | null
}

type TenantUpdateInput = Partial<NewTenantInput>

async function parseJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? "Une erreur est survenue.")
  }
  return data
}

async function fetchTenants(profileId: string): Promise<Tenant[]> {
  const response = await fetch(
    `/api/tenants?profileId=${encodeURIComponent(profileId)}`,
  )
  const data = await parseJsonOrThrow(response)
  return data.tenants as Tenant[]
}

export function useTenants(profileId: string) {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const refresh = useCallback(async () => {
    setTenants(await fetchTenants(profileId))
  }, [profileId])

  useEffect(() => {
    let cancelled = false

    fetchTenants(profileId)
      .then((nextTenants) => {
        if (!cancelled) setTenants(nextTenants)
      })
      .catch(() => {
        if (!cancelled) setTenants([])
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [profileId])

  const addTenant = useCallback(
    async (input: NewTenantInput) => {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, ...input }),
      })
      const tenant = (await parseJsonOrThrow(response)) as Tenant
      setTenants((current) => [tenant, ...current])
      return tenant
    },
    [profileId],
  )

  const updateTenant = useCallback(
    async (id: string, updates: TenantUpdateInput) => {
      const response = await fetch(`/api/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      const tenant = (await parseJsonOrThrow(response)) as Tenant
      setTenants((current) =>
        current.map((existing) =>
          existing.id === id ? { ...existing, ...tenant } : existing,
        ),
      )
      return tenant
    },
    [],
  )

  const removeTenant = useCallback(async (id: string) => {
    const response = await fetch(`/api/tenants/${id}`, { method: "DELETE" })
    await parseJsonOrThrow(response)
    setTenants((current) => current.filter((tenant) => tenant.id !== id))
  }, [])

  return {
    tenants,
    isLoaded,
    addTenant,
    updateTenant,
    removeTenant,
    refresh,
  }
}
