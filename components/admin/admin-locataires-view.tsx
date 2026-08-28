"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { CopyEmailButton } from "@/components/admin/email-invite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AdminTenant } from "@/lib/notion/tenants"

function TenantInviteRow({
  tenantId,
  currentEmail,
  verificationCode,
  hasAccount,
}: {
  tenantId: string
  currentEmail: string | null | undefined
  verificationCode: string | null | undefined
  hasAccount: boolean
}) {
  const router = useRouter()
  const [email, setEmail] = useState(currentEmail ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fresh, setFresh] = useState<{ email: string; code: string } | null>(
    null
  )

  const displayCode = fresh?.code ?? verificationCode
  const displayEmail = fresh?.email ?? currentEmail

  async function handleInvite() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/tenants/${tenantId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      setFresh({ email: data.email, code: data.verificationCode })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  if (hasAccount) {
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
        <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs tracking-wider">
          {displayCode}
        </code>
        <CopyEmailButton
          email={displayEmail}
          firstName={undefined}
          activationCode={displayCode}
          tenant
        />
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
        onChange={(e) => setEmail(e.target.value)}
        className="h-8 w-48 text-sm"
      />
      <Button
        type="button"
        size="sm"
        disabled={loading || !email}
        onClick={handleInvite}
      >
        {loading ? "Envoi…" : "Inviter"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}

type AdminLocatairesViewProps = {
  tenants: AdminTenant[]
  sciByPageId: Record<string, string>
}

export function AdminLocatairesView({
  tenants,
  sciByPageId,
}: AdminLocatairesViewProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Locataire
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Bailleur
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Accès locataire
            </th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => {
            const sciName = tenant.profilePageId
              ? (sciByPageId[tenant.profilePageId] ?? "–")
              : "–"
            return (
              <tr
                key={tenant.id}
                className="border-b border-border last:border-0 hover:bg-muted/20"
              >
                <td className="px-4 py-3 font-medium">
                  {tenant.civility} {tenant.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{sciName}</td>
                <td className="px-4 py-3">
                  <TenantInviteRow
                    tenantId={tenant.id}
                    currentEmail={tenant.email}
                    verificationCode={tenant.verificationCode}
                    hasAccount={tenant.hasAccount}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
