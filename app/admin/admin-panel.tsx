"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import type { Profile } from "@/lib/profiles"
import type { AdminTenant } from "@/lib/notion/tenants"
import type { NotionUser } from "@/lib/notion/users"

// ─── Copy email button ────────────────────────────────────────────────────────

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

  function buildTemplate() {
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
      "Votre compte Quittances de loyer a été créé.",
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

  async function handleCopy() {
    await navigator.clipboard.writeText(buildTemplate())
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
  const [fresh, setFresh] = useState<{ email: string; code: string } | null>(null)

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

// ─── SCI actions ──────────────────────────────────────────────────────────────

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
        + Nouvelle SCI
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        autoFocus
        placeholder="Nom de la SCI"
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
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        Annuler
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}

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
      const res = await fetch(`/api/profiles/${profileId}`, { method: "DELETE" })
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
        className="cursor-not-allowed text-xs text-muted-foreground"
        title={disabledReason}
      >
        Supprimer
      </span>
    )
  }

  if (!confirm) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirm(true)}
      >
        Supprimer
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-destructive">Supprimer «&nbsp;{sciName}&nbsp;» ?</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={loading}
        onClick={handleDelete}
      >
        {loading ? "…" : "Confirmer"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm(false)}>
        Annuler
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}

// ─── SCI invite row ──────────────────────────────────────────────────────────

function SciInviteRow({
  profileId,
  existingBailleur,
  onInvited,
}: {
  profileId: string
  existingBailleur: NotionUser | undefined
  onInvited: () => void
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fresh, setFresh] = useState<{ email: string; activationCode: string } | null>(null)

  const result = fresh ?? (
    existingBailleur && !existingBailleur.passwordHash && existingBailleur.activationCode
      ? { email: existingBailleur.email, activationCode: existingBailleur.activationCode }
      : null
  )

  async function handleCreate() {
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
      setOpen(false)
      onInvited()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  if (existingBailleur?.passwordHash) {
    return (
      <div>
        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <span className="size-1.5 rounded-full bg-current" />
          Inscrit
        </span>
        <span className="text-xs text-muted-foreground">{existingBailleur.email}</span>
      </div>
    )
  }

  if (result && !open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="size-1.5 rounded-full bg-current" />
            En attente
          </span>
          <span className="text-xs text-muted-foreground">{result.email}</span>
        </div>
        <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs tracking-wider">
          {result.activationCode}
        </code>
        <CopyEmailButton
          email={result.email}
          firstName={existingBailleur?.firstName}
          activationCode={result.activationCode}
        />
      </div>
    )
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Inviter le bailleur
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          autoFocus
          type="email"
          placeholder="email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 w-48 text-sm"
        />
        <Input
          placeholder="Prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="h-8 w-28 text-sm"
        />
        <Input
          placeholder="Nom"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="h-8 w-28 text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={loading || !email}
          onClick={handleCreate}
        >
          {loading ? "Création…" : "Créer le compte"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Annuler
        </Button>
        {error ? <span className="text-xs text-destructive">{error}</span> : null}
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type AdminPanelProps = {
  users: NotionUser[]
  tenants: AdminTenant[]
  profiles: Profile[]
  sciByPageId: Record<string, string>
  tenantCountByProfileId: Record<string, number>
  bailleurByProfilePageId: Record<string, NotionUser>
  profilePageIdBySlug: Record<string, string>
}

export function AdminPanel({
  users,
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

      <Tabs defaultValue="utilisateurs">
        <TabsList>
          <TabsTab value="utilisateurs">
            Utilisateurs
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {users.length}
            </span>
          </TabsTab>
          <TabsTab value="locataires">
            Locataires
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {tenants.length}
            </span>
          </TabsTab>
          <TabsTab value="scis">
            SCIs
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {profiles.length}
            </span>
          </TabsTab>
        </TabsList>

        {/* ── Utilisateurs ── */}
        <TabsPanel value="utilisateurs">
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rôle</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">SCI</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code / Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isActivated = Boolean(user.passwordHash)
                  const sciName = user.profilePageId
                    ? (sciByPageId[user.profilePageId] ?? "–")
                    : "–"
                  return (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        {[user.firstName, user.lastName].filter(Boolean).join(" ") || "–"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={
                          user.role === "admin"
                            ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                            : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        }>
                          {user.role === "admin" ? "Admin" : "Bailleur"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.role === "bailleur" ? sciName : "–"}
                      </td>
                      <td className="px-4 py-3">
                        {isActivated ? (
                          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                            <span className="size-1.5 rounded-full bg-current" />
                            Inscrit
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                            <span className="size-1.5 rounded-full bg-current" />
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isActivated ? (
                          <span className="text-muted-foreground">–</span>
                        ) : user.activationCode ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs tracking-wider">
                              {user.activationCode}
                            </code>
                            <CopyEmailButton
                              email={user.email}
                              firstName={user.firstName}
                              activationCode={user.activationCode}
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsPanel>

        {/* ── Locataires ── */}
        <TabsPanel value="locataires">
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Locataire</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">SCI</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Accès locataire</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => {
                  const sciName = tenant.profilePageId
                    ? (sciByPageId[tenant.profilePageId] ?? "–")
                    : "–"
                  return (
                    <tr key={tenant.id} className="border-b border-border last:border-0 hover:bg-muted/20">
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
        </TabsPanel>

        {/* ── SCIs ── */}
        <TabsPanel value="scis">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <CreateSciForm onCreated={refresh} />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom SCI</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Gérant</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ville</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Locataires</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Compte bailleur</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supprimer</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => {
                    const count = tenantCountByProfileId[profile.id] ?? 0
                    const canDelete = count === 0
                    const pageId = profilePageIdBySlug[profile.id]
                    const bailleur = pageId ? bailleurByProfilePageId[pageId] : undefined
                    return (
                      <tr key={profile.id} className="border-b border-border last:border-0 hover:bg-muted/20 align-top">
                        <td className="px-4 py-3 font-medium">{profile.sciName}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {profile.managerName || "–"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {profile.city || "–"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{count}</td>
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
                            disabledReason={!canDelete ? `${count} locataire(s) actif(s)` : undefined}
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
