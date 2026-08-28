"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { EmailModal } from "@/components/admin/email-invite"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import type { Profile } from "@/lib/profiles"
import type { NotionUser } from "@/lib/notion/users"

function CreateBailleurForm({ onCreated }: { onCreated: () => void }) {
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

function DeleteBailleurButton({
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

function BailleurInviteRow({
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

type AdminBailleursViewProps = {
  profiles: Profile[]
  tenantCountByProfileId: Record<string, number>
  bailleurByProfilePageId: Record<string, NotionUser>
  profilePageIdBySlug: Record<string, string>
}

export function AdminBailleursView({
  profiles,
  tenantCountByProfileId,
  bailleurByProfilePageId,
  profilePageIdBySlug,
}: AdminBailleursViewProps) {
  const router = useRouter()

  function refresh() {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateBailleurForm onCreated={refresh} />
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
                  <td className="px-4 py-3 font-medium">{profile.sciName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {profile.managerName || "–"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{count}</td>
                  <td className="px-4 py-3">
                    <BailleurInviteRow
                      profileId={profile.id}
                      existingBailleur={bailleur}
                      onInvited={refresh}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <DeleteBailleurButton
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
  )
}
