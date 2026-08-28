"use client"

import { useState } from "react"

import { Accordion } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TenantAvatar } from "@/components/tenants/tenant-avatar"
import type { Tenant } from "@/lib/tenants"

type TenantsAccessViewProps = {
  tenants: Tenant[]
  tenantsLoaded: boolean
  onUpdated: () => void
}

function AccessStatusBadge({ tenant }: { tenant: Tenant }) {
  if (tenant.hasAccount) {
    return (
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        Activé
      </span>
    )
  }
  if (tenant.verificationCode) {
    return (
      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        Invitation envoyée
      </span>
    )
  }
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Pas invité
    </span>
  )
}

function TenantAccessRow({
  tenant,
  onUpdated,
}: {
  tenant: Tenant
  onUpdated: () => void
}) {
  const [email, setEmail] = useState(tenant.email ?? "")
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)

  async function handleInvite() {
    if (!email.trim()) return
    setIsInviting(true)
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
      setInviteCode(data.verificationCode as string)
      onUpdated()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Erreur lors de l'invitation."
      )
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <Accordion
      defaultOpen={false}
      title={
        <div className="flex items-center gap-3">
          <TenantAvatar seed={tenant.avatarSeed} name={tenant.name} size="sm" />
          <span>
            {tenant.civility} {tenant.name}
          </span>
        </div>
      }
      badge={<AccessStatusBadge tenant={tenant} />}
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`access-email-${tenant.id}`}>
            Email du locataire
          </Label>
          <Input
            id={`access-email-${tenant.id}`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="locataire@exemple.fr"
          />
        </div>

        {inviteCode ? (
          <p className="rounded-2xl bg-muted/50 p-3 text-sm">
            Code à transmettre au locataire :{" "}
            <span className="font-mono font-medium">{inviteCode}</span>
            <br />
            <span className="text-muted-foreground">
              Ce code ne s&apos;affichera qu&apos;une fois ici.
            </span>
          </p>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div>
          <Button
            type="button"
            variant="outline"
            disabled={!email.trim() || isInviting}
            onClick={handleInvite}
          >
            {isInviting
              ? "Génération..."
              : tenant.hasAccount || tenant.verificationCode
                ? "Générer un nouveau code d'activation"
                : "Générer un code d'activation"}
          </Button>
        </div>
      </div>
    </Accordion>
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
    <div className="flex flex-col gap-4">
      {tenants.map((tenant) => (
        <TenantAccessRow
          key={tenant.id}
          tenant={tenant}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  )
}
