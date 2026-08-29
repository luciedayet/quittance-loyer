"use client"

import { useState } from "react"

import { EmailModal } from "@/components/shared/email-invite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function TenantInviteRow({
  tenantId,
  currentEmail,
  verificationCode,
  hasAccount,
  onUpdated,
}: {
  tenantId: string
  currentEmail: string | null | undefined
  verificationCode: string | null | undefined
  hasAccount: boolean
  onUpdated: () => void
}) {
  const [email, setEmail] = useState(currentEmail ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fresh, setFresh] = useState<{ email: string; code: string } | null>(
    null
  )
  const [modalOpen, setModalOpen] = useState(false)

  const displayCode = fresh?.code ?? verificationCode
  const displayEmail = fresh?.email ?? currentEmail

  async function handleInvite() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/tenants/${tenantId}/invite`, {
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
      <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{displayEmail}</span>
          <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs tracking-wider">
            {displayCode}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            Envoyer par email
          </Button>
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
        <EmailModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          email={displayEmail}
          activationCode={displayCode}
          tenant
        />
      </>
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
