"use client"

import { useCallback, useEffect, useState } from "react"

import type { QuittanceRecord } from "@/lib/notion/quittances"

async function fetchQuittances(profileId: string): Promise<QuittanceRecord[]> {
  const response = await fetch(
    `/api/quittances?profileId=${encodeURIComponent(profileId)}`,
  )
  if (!response.ok) {
    throw new Error("Impossible de charger les quittances.")
  }
  const data = await response.json()
  return data.quittances as QuittanceRecord[]
}

export function useProfileQuittances(profileId: string) {
  const [quittances, setQuittances] = useState<QuittanceRecord[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const refresh = useCallback(async () => {
    setQuittances(await fetchQuittances(profileId))
  }, [profileId])

  useEffect(() => {
    let cancelled = false

    fetchQuittances(profileId)
      .then((next) => {
        if (!cancelled) setQuittances(next)
      })
      .catch(() => {
        if (!cancelled) setQuittances([])
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [profileId])

  return { quittances, isLoaded, refresh }
}
