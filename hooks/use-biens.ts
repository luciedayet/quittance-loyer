"use client"

import { useCallback, useEffect, useState } from "react"

import type { Bien } from "@/lib/biens"

type NewBienInput = {
  name: string
  shortAddress?: string
  lines: string[]
}

type BienUpdateInput = Partial<NewBienInput>

async function parseJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? "Une erreur est survenue.")
  }
  return data
}

async function fetchBiens(profileId: string): Promise<Bien[]> {
  const response = await fetch(
    `/api/biens?profileId=${encodeURIComponent(profileId)}`
  )
  const data = await parseJsonOrThrow(response)
  return data.biens as Bien[]
}

export function useBiens(profileId: string) {
  const [biens, setBiens] = useState<Bien[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const refresh = useCallback(async () => {
    setBiens(await fetchBiens(profileId))
  }, [profileId])

  useEffect(() => {
    let cancelled = false

    fetchBiens(profileId)
      .then((nextBiens) => {
        if (!cancelled) setBiens(nextBiens)
      })
      .catch(() => {
        if (!cancelled) setBiens([])
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [profileId])

  const addBien = useCallback(
    async (input: NewBienInput) => {
      const response = await fetch("/api/biens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, ...input }),
      })
      const bien = (await parseJsonOrThrow(response)) as Bien
      setBiens((current) => [...current, bien])
      return bien
    },
    [profileId]
  )

  const updateBien = useCallback(
    async (id: string, updates: BienUpdateInput) => {
      const response = await fetch(`/api/biens/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      const bien = (await parseJsonOrThrow(response)) as Bien
      setBiens((current) =>
        current.map((existing) => (existing.id === id ? bien : existing))
      )
      return bien
    },
    []
  )

  const removeBien = useCallback(async (id: string) => {
    const response = await fetch(`/api/biens/${id}`, { method: "DELETE" })
    await parseJsonOrThrow(response)
    setBiens((current) => current.filter((bien) => bien.id !== id))
  }, [])

  return {
    biens,
    isLoaded,
    addBien,
    updateBien,
    removeBien,
    refresh,
  }
}
