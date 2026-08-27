"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatEuros, periodFromMonth } from "@/lib/quittance"
import type { RentChange, Tenant, TenantCivility } from "@/lib/tenants"

type TenantUpdate = {
  civility: TenantCivility
  name: string
  rentAmount: number
  chargesAmount: number
  firstQuittanceDate: string | null
  lastQuittanceDate: string | null
  location: string | null
}

type EditTenantDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: Tenant | null
  availableLocations: string[]
  onSubmit: (update: TenantUpdate) => Promise<void>
  /** Rafraîchit la liste après une invitation ou une augmentation. */
  onTenantChanged?: () => void
}

export function EditTenantDialog({
  open,
  onOpenChange,
  tenant,
  availableLocations,
  onSubmit,
  onTenantChanged,
}: EditTenantDialogProps) {
  const [civility, setCivility] = useState<TenantCivility>(
    tenant?.civility ?? "M.",
  )
  const [name, setName] = useState(tenant?.name ?? "")
  const [rentAmount, setRentAmount] = useState(
    tenant ? String(tenant.rentAmount) : "",
  )
  const [chargesAmount, setChargesAmount] = useState(
    tenant ? String(tenant.chargesAmount) : "",
  )
  const [firstQuittanceDate, setFirstQuittanceDate] = useState(
    tenant?.firstQuittanceDate ?? "",
  )
  const [lastQuittanceDate, setLastQuittanceDate] = useState(
    tenant?.lastQuittanceDate ?? "",
  )
  const [location, setLocation] = useState(tenant?.location ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loadedTenantId, setLoadedTenantId] = useState<string | null>(null)

  const [email, setEmail] = useState(tenant?.email ?? "")
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)

  const [rentHistory, setRentHistory] = useState<RentChange[]>(
    tenant?.rentHistory ?? [],
  )
  const [newEffectiveMonth, setNewEffectiveMonth] = useState("")
  const [newRentAmount, setNewRentAmount] = useState("")
  const [newChargesAmount, setNewChargesAmount] = useState("")
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isSavingHistory, setIsSavingHistory] = useState(false)

  if (tenant && tenant.id !== loadedTenantId) {
    setLoadedTenantId(tenant.id)
    setCivility(tenant.civility)
    setName(tenant.name)
    setRentAmount(String(tenant.rentAmount))
    setChargesAmount(String(tenant.chargesAmount))
    setFirstQuittanceDate(tenant.firstQuittanceDate ?? "")
    setLastQuittanceDate(tenant.lastQuittanceDate ?? "")
    setLocation(tenant.location ?? "")
    setError(null)
    setEmail(tenant.email ?? "")
    setInviteCode(null)
    setInviteError(null)
    setRentHistory(tenant.rentHistory)
    setNewEffectiveMonth("")
    setNewRentAmount("")
    setNewChargesAmount("")
    setHistoryError(null)
  }

  async function handleInvite() {
    if (!tenant || !email.trim()) return

    setIsInviting(true)
    setInviteError(null)

    try {
      const response = await fetch(`/api/tenants/${tenant.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error ?? "Erreur lors de l'envoi de l'invitation.")
      }

      setInviteCode(data.verificationCode as string)
      onTenantChanged?.()
    } catch (cause) {
      setInviteError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de l'envoi de l'invitation.",
      )
    } finally {
      setIsInviting(false)
    }
  }

  async function persistRentHistory(nextHistory: RentChange[]) {
    if (!tenant) return

    setIsSavingHistory(true)
    setHistoryError(null)

    try {
      const response = await fetch(`/api/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentHistory: nextHistory }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(
          data?.error ?? "Erreur lors de la mise à jour du loyer.",
        )
      }
      setRentHistory(nextHistory)
      onTenantChanged?.()
    } catch (cause) {
      setHistoryError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de la mise à jour du loyer.",
      )
    } finally {
      setIsSavingHistory(false)
    }
  }

  async function handleAddRentChange() {
    const rent = Number.parseFloat(newRentAmount.replace(",", "."))
    const charges = Number.parseFloat(newChargesAmount.replace(",", "."))

    if (!newEffectiveMonth) {
      setHistoryError("Le mois d'effet est requis.")
      return
    }
    if (!Number.isFinite(rent) || rent <= 0) {
      setHistoryError("Le nouveau loyer doit être un montant positif.")
      return
    }
    if (!Number.isFinite(charges) || charges < 0) {
      setHistoryError(
        "Les nouvelles charges doivent être un montant positif ou nul.",
      )
      return
    }

    const entry: RentChange = {
      id: crypto.randomUUID(),
      effectiveMonth: newEffectiveMonth,
      rentAmount: rent,
      chargesAmount: charges,
    }

    await persistRentHistory([...rentHistory, entry])
    setNewEffectiveMonth("")
    setNewRentAmount("")
    setNewChargesAmount("")
  }

  async function handleRemoveRentChange(id: string) {
    await persistRentHistory(rentHistory.filter((entry) => entry.id !== id))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const rent = Number.parseFloat(rentAmount.replace(",", "."))
    const charges = Number.parseFloat(chargesAmount.replace(",", "."))

    if (!name.trim()) {
      setError("Le nom du locataire est requis.")
      return
    }

    if (!Number.isFinite(rent) || rent <= 0) {
      setError("Le loyer doit être un montant positif.")
      return
    }

    if (!Number.isFinite(charges) || charges < 0) {
      setError("Les charges doivent être un montant positif ou nul.")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSubmit({
        civility,
        name: name.trim(),
        rentAmount: rent,
        chargesAmount: charges,
        firstQuittanceDate: firstQuittanceDate || null,
        lastQuittanceDate: lastQuittanceDate || null,
        location: location.trim() || null,
      })
      onOpenChange(false)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Erreur lors de l'enregistrement.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le locataire</DialogTitle>
          <DialogDescription>
            Les montants seront réutilisés pour chaque quittance de ce
            locataire.
          </DialogDescription>
        </DialogHeader>

        {tenant ? (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="edit-tenant-civility">Civilité</Label>
              <Select
                value={civility}
                onValueChange={(value) => setCivility(value as TenantCivility)}
              >
                <SelectTrigger id="edit-tenant-civility" className="w-full">
                  <SelectValue placeholder="Choisir une civilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M.">M.</SelectItem>
                  <SelectItem value="Mme">Mme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-tenant-name">Nom du locataire</Label>
              <Input
                id="edit-tenant-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Dupont"
                autoFocus
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-tenant-rent">
                  Loyer hors charges (€)
                </Label>
                <Input
                  id="edit-tenant-rent"
                  inputMode="decimal"
                  value={rentAmount}
                  onChange={(event) => setRentAmount(event.target.value)}
                  placeholder="650,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tenant-charges">
                  Provision pour charges (€)
                </Label>
                <Input
                  id="edit-tenant-charges"
                  inputMode="decimal"
                  value={chargesAmount}
                  onChange={(event) => setChargesAmount(event.target.value)}
                  placeholder="50,00"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-tenant-location">Lieu</Label>
              <Input
                id="edit-tenant-location"
                list="edit-tenant-location-options"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="ex. Chambre 2"
              />
              <datalist id="edit-tenant-location-options">
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-tenant-first-quittance">
                  Première quittance
                </Label>
                <Input
                  id="edit-tenant-first-quittance"
                  type="date"
                  value={firstQuittanceDate}
                  onChange={(event) =>
                    setFirstQuittanceDate(event.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tenant-last-quittance">
                  Dernière quittance
                </Label>
                <Input
                  id="edit-tenant-last-quittance"
                  type="date"
                  value={lastQuittanceDate}
                  onChange={(event) =>
                    setLastQuittanceDate(event.target.value)
                  }
                />
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}

        {tenant ? (
          <div className="grid gap-3 border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium">Augmentations de loyer</p>
              <p className="text-sm text-muted-foreground">
                Le loyer et les charges ci-dessus s&apos;appliquent tant
                qu&apos;aucune augmentation n&apos;est enregistrée pour une
                période donnée.
              </p>
            </div>

            {rentHistory.length > 0 ? (
              <ul className="grid gap-2">
                {[...rentHistory]
                  .sort((a, b) =>
                    a.effectiveMonth < b.effectiveMonth ? 1 : -1,
                  )
                  .map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2 text-sm"
                    >
                      <span className="capitalize">
                        À partir de{" "}
                        {periodFromMonth(entry.effectiveMonth)?.label ??
                          entry.effectiveMonth}{" "}
                        : {formatEuros(entry.rentAmount)} € + charges{" "}
                        {formatEuros(entry.chargesAmount)} €
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={isSavingHistory}
                        onClick={() => handleRemoveRentChange(entry.id)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                        <span className="sr-only">
                          Supprimer cette augmentation
                        </span>
                      </Button>
                    </li>
                  ))}
              </ul>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="rent-change-month">Mois d&apos;effet</Label>
                <Input
                  id="rent-change-month"
                  type="month"
                  value={newEffectiveMonth}
                  onChange={(event) => setNewEffectiveMonth(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rent-change-rent">Nouveau loyer (€)</Label>
                <Input
                  id="rent-change-rent"
                  inputMode="decimal"
                  value={newRentAmount}
                  onChange={(event) => setNewRentAmount(event.target.value)}
                  placeholder="680,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rent-change-charges">
                  Nouvelles charges (€)
                </Label>
                <Input
                  id="rent-change-charges"
                  inputMode="decimal"
                  value={newChargesAmount}
                  onChange={(event) => setNewChargesAmount(event.target.value)}
                  placeholder="55,00"
                />
              </div>
            </div>

            {historyError ? (
              <p className="text-sm text-destructive">{historyError}</p>
            ) : null}

            <Button
              type="button"
              variant="outline"
              disabled={isSavingHistory}
              onClick={handleAddRentChange}
            >
              {isSavingHistory
                ? "Enregistrement..."
                : "Ajouter une augmentation"}
            </Button>
          </div>
        ) : null}

        {tenant ? (
          <div className="grid gap-3 border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium">Accès locataire</p>
              <p className="text-sm text-muted-foreground">
                {tenant.hasAccount
                  ? "Compte activé : le locataire peut consulter ses quittances."
                  : tenant.verificationCode
                    ? "Invitation envoyée, en attente d'activation."
                    : "Pas encore invité."}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-tenant-email">Email du locataire</Label>
              <Input
                id="edit-tenant-email"
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

            {inviteError ? (
              <p className="text-sm text-destructive">{inviteError}</p>
            ) : null}

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
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
