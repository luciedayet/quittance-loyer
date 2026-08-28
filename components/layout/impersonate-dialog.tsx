"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Settings01Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Profile } from "@/lib/profiles"
import type { Tenant } from "@/lib/tenants"
import { cn } from "@/lib/utils"

type ImpersonateMode = "bailleur" | "locataire"

export function ImpersonateDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ImpersonateMode>("bailleur")
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [profileId, setProfileId] = useState("")
  const [tenants, setTenants] = useState<Tenant[] | null>(null)
  const [tenantId, setTenantId] = useState("")
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch("/api/profiles")
      .then((response) => (response.ok ? response.json() : { profiles: [] }))
      .then((data) => {
        if (!cancelled) setProfiles(data.profiles as Profile[])
      })
      .catch(() => {
        if (!cancelled) setProfiles([])
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open || mode !== "locataire" || !profileId) return
    let cancelled = false
    fetch(`/api/tenants?profileId=${encodeURIComponent(profileId)}`)
      .then((response) => (response.ok ? response.json() : { tenants: [] }))
      .then((data) => {
        if (!cancelled) setTenants(data.tenants as Tenant[])
      })
      .catch(() => {
        if (!cancelled) setTenants([])
      })
    return () => {
      cancelled = true
    }
  }, [open, mode, profileId])

  function resetSelection() {
    setMode("bailleur")
    setProfileId("")
    setTenantId("")
    setTenants(null)
    setError(null)
  }

  function handleProfileChange(value: string | null) {
    setProfileId(value ?? "")
    setTenantId("")
    setTenants(null)
  }

  async function handleView() {
    if (!profileId) return
    if (mode === "locataire" && !tenantId) return

    setStarting(true)
    setError(null)
    try {
      const payload =
        mode === "bailleur"
          ? { role: mode, profileId }
          : { role: mode, profileId, tenantId }
      const response = await fetch("/api/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(
          data?.error ?? "Impossible de démarrer l'impersonation."
        )
      }

      const target =
        mode === "bailleur"
          ? `/${profileId}`
          : `/${profileId}/tenants/${tenantId}`
      setOpen(false)
      resetSelection()
      router.push(target)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.")
    } finally {
      setStarting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetSelection()
        setOpen(nextOpen)
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} />
        <span className="sr-only">Réglages</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Se connecter en tant que</DialogTitle>
          <DialogDescription>
            Choisis un bailleur (et un locataire) pour naviguer dans
            l&apos;application comme si tu étais ce bailleur ou ce locataire.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="inline-flex items-center gap-1 self-start rounded-2xl bg-muted p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("bailleur")}
              className={cn(
                "rounded-xl px-3 py-1 font-medium transition-colors",
                mode === "bailleur"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Bailleur
            </button>
            <button
              type="button"
              onClick={() => setMode("locataire")}
              className={cn(
                "rounded-xl px-3 py-1 font-medium transition-colors",
                mode === "locataire"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Locataire
            </button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="impersonate-profile">Bailleur</Label>
            <Select value={profileId} onValueChange={handleProfileChange}>
              <SelectTrigger id="impersonate-profile" className="w-full">
                <SelectValue
                  placeholder={
                    profiles === null ? "Chargement…" : "Choisir un bailleur"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(profiles ?? []).map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.sciName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "locataire" ? (
            <div className="grid gap-2">
              <Label htmlFor="impersonate-tenant">Locataire</Label>
              <Select
                value={tenantId}
                onValueChange={(value) => setTenantId(value ?? "")}
                disabled={!profileId}
              >
                <SelectTrigger id="impersonate-tenant" className="w-full">
                  <SelectValue
                    placeholder={
                      !profileId
                        ? "Choisir un bailleur d'abord"
                        : tenants === null
                          ? "Chargement…"
                          : "Choisir un locataire"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(tenants ?? []).map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.civility} {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleView}
            disabled={
              starting || !profileId || (mode === "locataire" && !tenantId)
            }
          >
            {starting ? "Chargement…" : "Voir cette vue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
