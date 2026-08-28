"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import type { Profile } from "@/lib/profiles"
import type { AdminTenant } from "@/lib/notion/tenants"
import type { NotionUser } from "@/lib/notion/users"

// ─── Email template helper ────────────────────────────────────────────────────

function buildEmailTemplate({
  email,
  firstName,
  activationCode,
  tenant,
}: {
  email: string
  firstName?: string
  activationCode: string
  tenant?: boolean
}): string {
  const appUrl = window.location.origin
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,"
  if (tenant) {
    return [
      greeting,
      "",
      "Vous avez été invité(e) à accéder à votre espace locataire.",
      "",
      `Rendez-vous sur : ${appUrl}/activation`,
      "",
      "Renseignez ces informations :",
      `• Email : ${email}`,
      `• Code de vérification : ${activationCode}`,
      "",
      "Vous pourrez ensuite définir votre mot de passe.",
    ].join("\n")
  }
  return [
    greeting,
    "",
    "Votre compte a été créé.",
    "",
    `Rendez-vous sur : ${appUrl}/activation`,
    "",
    "Renseignez ces informations :",
    `• Email : ${email}`,
    `• Code d'activation : ${activationCode}`,
    "",
    "Vous pourrez ensuite définir votre mot de passe.",
  ].join("\n")
}

// ─── Email modal ──────────────────────────────────────────────────────────────

function EmailModal({
  open,
  onClose,
  email,
  firstName,
  activationCode,
  tenant,
}: {
  open: boolean
  onClose: () => void
  email: string
  firstName?: string
  activationCode: string
  tenant?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const template = open
    ? buildEmailTemplate({ email, firstName, activationCode, tenant })
    : ""

  async function handleCopy() {
    await navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleMailto() {
    const subject = tenant ? "Votre accès locataire" : "Votre accès bailleur"
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(template)}`
    window.open(mailtoUrl, "_blank")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modèle d&apos;invitation</DialogTitle>
        </DialogHeader>
        <pre className="rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
          {template}
        </pre>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? "Copié !" : "Copier le texte"}
          </Button>
          <Button type="button" onClick={handleMailto}>
            Utiliser ma boite mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Copy email button (locataires tab) ───────────────────────────────────────

function CopyEmailButton({
  email,
  firstName,
  activationCode,
  tenant,
}: {
  email: string
  firstName?: string
  activationCode: string
  tenant?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const template = buildEmailTemplate({
      email,
      firstName,
      activationCode,
      tenant,
    })
    await navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? "Copié !" : "Copier l'email"}
    </Button>
  )
}

// ─── Tenant invite row ────────────────────────────────────────────────────────

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

// ─── Bailleur create form ─────────────────────────────────────────────────────

function CreateSciForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [sciName, setSciName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sciName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      setSciName("")
      setOpen(false)
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        + Nouveau bailleur
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        autoFocus
        placeholder="Nom du bailleur"
        value={sciName}
        onChange={(e) => setSciName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate()
          if (e.key === "Escape") setOpen(false)
        }}
        className="h-8 w-56 text-sm"
      />
      <Button
        type="button"
        size="sm"
        disabled={loading || !sciName.trim()}
        onClick={handleCreate}
      >
        {loading ? "Création…" : "Créer"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(false)}
      >
        Annuler
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}

// ─── Bailleur delete button ───────────────────────────────────────────────────

function DeleteSciButton({
  profileId,
  sciName,
  disabled,
  disabledReason,
  onDeleted,
}: {
  profileId: string
  sciName: string
  disabled: boolean
  disabledReason?: string
  onDeleted: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/profiles/${profileId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      onDeleted()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
      setConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  if (disabled) {
    return (
      <span
        title={disabledReason}
        className="inline-flex cursor-not-allowed opacity-30"
      >
        <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
      </span>
    )
  }

  if (!confirm) {
    return (
      <button
        type="button"
        title={`Supprimer ${sciName}`}
        className="inline-flex text-destructive opacity-70 transition-opacity hover:opacity-100"
        onClick={() => setConfirm(true)}
      >
        <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-destructive">
        Supprimer «&nbsp;{sciName}&nbsp;» ?
      </span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={loading}
        onClick={handleDelete}
      >
        {loading ? "…" : "Confirmer"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirm(false)}
      >
        Annuler
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}

// ─── Bailleur invite row ──────────────────────────────────────────────────────

function SciInviteRow({
  profileId,
  existingBailleur,
  onInvited,
}: {
  profileId: string
  existingBailleur: NotionUser | undefined
  onInvited: () => void
}) {
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fresh, setFresh] = useState<{
    email: string
    activationCode: string
  } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const pendingResult =
    fresh ??
    (existingBailleur &&
    !existingBailleur.passwordHash &&
    existingBailleur.activationCode
      ? {
          email: existingBailleur.email,
          activationCode: existingBailleur.activationCode,
        }
      : null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, profileId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      setFresh({ email: data.email, activationCode: data.activationCode })
      setEmail("")
      setFirstName("")
      setLastName("")
      onInvited()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  if (existingBailleur?.passwordHash) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <span className="size-1.5 rounded-full bg-current" />
          Inscrit
        </span>
        <span className="text-xs text-muted-foreground">
          {existingBailleur.email}
        </span>
      </div>
    )
  }

  if (pendingResult) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-current" />
              En attente
            </span>
            <span className="text-xs text-muted-foreground">
              {pendingResult.email}
            </span>
          </div>
          <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs tracking-wider">
            {pendingResult.activationCode}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            Envoyer par email
          </Button>
        </div>
        <EmailModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          email={pendingResult.email}
          firstName={existingBailleur?.firstName}
          activationCode={pendingResult.activationCode}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="email"
          placeholder="email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 w-44 text-sm"
        />
        <Input
          placeholder="Prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="h-8 w-24 text-sm"
        />
        <Input
          placeholder="Nom"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="h-8 w-24 text-sm"
        />
        <Button
          type="button"
          size="sm"
          disabled={loading || !email}
          onClick={handleGenerate}
        >
          {loading ? "Génération…" : "Générer le code d'activation"}
        </Button>
      </div>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type AdminPanelProps = {
  tenants: AdminTenant[]
  profiles: Profile[]
  sciByPageId: Record<string, string>
  tenantCountByProfileId: Record<string, number>
  bailleurByProfilePageId: Record<string, NotionUser>
  profilePageIdBySlug: Record<string, string>
}

export function AdminPanel({
  tenants,
  profiles,
  sciByPageId,
  tenantCountByProfileId,
  bailleurByProfilePageId,
  profilePageIdBySlug,
}: AdminPanelProps) {
  const router = useRouter()

  function refresh() {
    router.refresh()
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <h1 className="font-heading text-2xl font-medium">Administration</h1>

      <Tabs defaultValue="locataires">
        <TabsList>
          <TabsTab value="locataires">
            Locataires
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {tenants.length}
            </span>
          </TabsTab>
          <TabsTab value="scis">
            Bailleurs
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {profiles.length}
            </span>
          </TabsTab>
        </TabsList>

        {/* ── Locataires ── */}
        <TabsPanel value="locataires">
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
                      <td className="px-4 py-3 text-muted-foreground">
                        {sciName}
                      </td>
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
        </TabsPanel>

        {/* ── Bailleurs ── */}
        <TabsPanel value="scis">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <CreateSciForm onCreated={refresh} />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Responsable
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Locataires
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Compte bailleur
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => {
                    const count = tenantCountByProfileId[profile.id] ?? 0
                    const canDelete = count === 0
                    const pageId = profilePageIdBySlug[profile.id]
                    const bailleur = pageId
                      ? bailleurByProfilePageId[pageId]
                      : undefined
                    return (
                      <tr
                        key={profile.id}
                        className="border-b border-border align-top last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 font-medium">
                          {profile.sciName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {profile.managerName || "–"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {count}
                        </td>
                        <td className="px-4 py-3">
                          <SciInviteRow
                            profileId={profile.id}
                            existingBailleur={bailleur}
                            onInvited={refresh}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <DeleteSciButton
                            profileId={profile.id}
                            sciName={profile.sciName}
                            disabled={!canDelete}
                            disabledReason={
                              !canDelete
                                ? `${count} locataire(s) actif(s)`
                                : undefined
                            }
                            onDeleted={refresh}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsPanel>
      </Tabs>
    </div>
  )
}
