"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type ImpersonatePayload =
  | { role: "bailleur"; profileId: string }
  | { role: "locataire"; profileId: string; tenantId: string }

export function ImpersonateButton({
  payload,
  label = "Voir en tant que",
}: {
  payload: ImpersonatePayload
  label?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(
          data?.error ?? "Impossible de démarrer l'impersonation."
        )
      }
      const target =
        payload.role === "bailleur"
          ? `/${payload.profileId}`
          : `/${payload.profileId}/tenants/${payload.tenantId}`
      router.push(target)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? "Chargement…" : label}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}
