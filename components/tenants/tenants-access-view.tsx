"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TenantAvatar } from "@/components/tenants/tenant-avatar"
import type { Tenant } from "@/lib/tenants"

type TenantsAccessViewProps = {
  tenants: Tenant[]
  tenantsLoaded: boolean
  onUpdated: () => void
}

function TenantAccessCell({
  tenant,
  onUpdated,
}: {
  tenant: Tenant
  onUpdated: () => void
}) {
  const [email, setEmail] = useState(tenant.email ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fresh, setFresh] = useState<{ email: string; code: string } | null>(
    null
  )

  const displayCode = fresh?.code ?? tenant.verificationCode
  const displayEmail = fresh?.email ?? tenant.email

  async function handleInvite() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tenants/${tenant.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error ?? "Erreur lors de l'invitation.")
      }
      setFresh({ email: data.email, code: data.verificationCode })
      onUpdated()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Erreur lors de l'invitation."
      )
    } finally {
      setLoading(false)
    }
  }

  if (tenant.hasAccount) {
    return (
      <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
        <span className="size-1.5 rounded-full bg-current" />
        Compte activé
      </span>
    )
  }

  if (displayEmail && displayCode) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">{displayEmail}</span>
        <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs tracking-wider">
          {displayCode}
        </code>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setFresh(null)
            setEmail(displayEmail)
          }}
        >
          Re-inviter
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="email"
        placeholder="email@exemple.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="h-8 w-48 text-sm"
      />
      <Button
        type="button"
        size="sm"
        disabled={loading || !email.trim()}
        onClick={handleInvite}
      >
        {loading ? "Envoi…" : "Inviter"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}

export function TenantsAccessView({
  tenants,
  tenantsLoaded,
  onUpdated,
}: TenantsAccessViewProps) {
  if (!tenantsLoaded) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted text-3xl">
          🔑
        </div>
        <div className="space-y-1">
          <p className="font-medium">Aucun locataire pour l&apos;instant</p>
          <p className="text-sm text-muted-foreground">
            Ajoutez un locataire dans l&apos;onglet{" "}
            <span className="font-medium text-foreground">Locataires</span> pour
            gérer ses accès.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Locataire
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Accès locataire
            </th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr
              key={tenant.id}
              className="border-b border-border last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3 font-medium">
                <div className="flex items-center gap-3">
                  <TenantAvatar
                    seed={tenant.avatarSeed}
                    name={tenant.name}
                    size="sm"
                  />
                  <span>
                    {tenant.civility} {tenant.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <TenantAccessCell tenant={tenant} onUpdated={onUpdated} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
