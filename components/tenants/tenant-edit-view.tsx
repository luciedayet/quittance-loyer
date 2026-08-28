"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import type { Bien } from "@/lib/biens"
import type { Profile } from "@/lib/profiles"
import { formatEuros, periodFromMonth } from "@/lib/quittance"
import type { RentChange, Tenant, TenantCivility } from "@/lib/tenants"
import { cn } from "@/lib/utils"

type TenantEditViewProps = {
  profile: Profile
  tenant: Tenant
  availableLocations: string[]
  biens: Bien[]
}

export function TenantEditView({
  profile,
  tenant: initialTenant,
  availableLocations,
  biens,
}: TenantEditViewProps) {
  const router = useRouter()
  const [tenant] = useState(initialTenant)

  // --- champs principaux ---
  const [civility, setCivility] = useState<TenantCivility>(tenant.civility)
  const [name, setName] = useState(tenant.name)
  const [rentAmount, setRentAmount] = useState(String(tenant.rentAmount))
  const [chargesAmount, setChargesAmount] = useState(
    String(tenant.chargesAmount)
  )
  const [firstQuittanceDate, setFirstQuittanceDate] = useState(
    tenant.firstQuittanceDate ?? ""
  )
  const [lastQuittanceDate, setLastQuittanceDate] = useState(
    tenant.lastQuittanceDate ?? ""
  )
  const [location, setLocation] = useState(tenant.location ?? "")
  const [bienId, setBienId] = useState(tenant.bienId ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // --- augmentations ---
  const [rentHistory, setRentHistory] = useState<RentChange[]>(
    tenant.rentHistory
  )
  const [newEffectiveMonth, setNewEffectiveMonth] = useState("")
  const [newRentAmount, setNewRentAmount] = useState("")
  const [newChargesAmount, setNewChargesAmount] = useState("")
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isSavingHistory, setIsSavingHistory] = useState(false)

  // --- suppression ---
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
    if (!bienId) {
      setError("Le bien est requis.")
      return
    }

    setIsSaving(true)
    setError(null)
    setSaved(false)

    try {
      const response = await fetch(`/api/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          civility,
          name: name.trim(),
          rentAmount: rent,
          chargesAmount: charges,
          firstQuittanceDate: firstQuittanceDate || null,
          lastQuittanceDate: lastQuittanceDate || null,
          location: location.trim() || null,
          bienId,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok)
        throw new Error(data?.error ?? "Erreur lors de l'enregistrement.")
      setSaved(true)
      router.refresh()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de l'enregistrement."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function persistRentHistory(nextHistory: RentChange[]) {
    setIsSavingHistory(true)
    setHistoryError(null)
    try {
      const response = await fetch(`/api/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentHistory: nextHistory }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok)
        throw new Error(data?.error ?? "Erreur lors de la mise à jour.")
      setRentHistory(nextHistory)
    } catch (cause) {
      setHistoryError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de la mise à jour."
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
        "Les nouvelles charges doivent être un montant positif ou nul."
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

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const response = await fetch(`/api/tenants/${tenant.id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Erreur lors de la suppression.")
      router.push(`/${profile.id}/locataires`)
    } catch (cause) {
      setDeleteError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de la suppression."
      )
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="space-y-2">
        <Link
          href={`/${profile.id}/locataires`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← Retour aux locataires
        </Link>
        <h1 className="font-heading text-2xl font-medium">
          Modifier {tenant.civility} {tenant.name}
        </h1>
      </div>

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>
            Ces informations sont utilisées sur les quittances générées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="edit-civility">Civilité</Label>
              <Select
                value={civility}
                onValueChange={(v) => setCivility(v as TenantCivility)}
              >
                <SelectTrigger id="edit-civility" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M.">M.</SelectItem>
                  <SelectItem value="Mme">Mme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nom du locataire</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dupont"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-rent">Loyer hors charges (€)</Label>
                <Input
                  id="edit-rent"
                  inputMode="decimal"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  placeholder="650,00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-charges">Provision pour charges (€)</Label>
                <Input
                  id="edit-charges"
                  inputMode="decimal"
                  value={chargesAmount}
                  onChange={(e) => setChargesAmount(e.target.value)}
                  placeholder="50,00"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-bien">Bien</Label>
              <Select
                value={bienId}
                onValueChange={(value) => setBienId(value ?? "")}
                items={Object.fromEntries(
                  biens.map((bien) => [bien.id, bien.name])
                )}
              >
                <SelectTrigger id="edit-bien" className="w-full">
                  <SelectValue placeholder="Choisir un bien" />
                </SelectTrigger>
                <SelectContent>
                  {biens.map((bien) => (
                    <SelectItem key={bien.id} value={bien.id}>
                      {bien.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-location">Lieu</Label>
              <Input
                id="edit-location"
                list="edit-page-location-options"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ex. Chambre 2"
              />
              <datalist id="edit-page-location-options">
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-first-quittance">
                  Date d&apos;arrivée
                </Label>
                <Input
                  id="edit-first-quittance"
                  type="date"
                  value={firstQuittanceDate}
                  onChange={(e) => setFirstQuittanceDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-last-quittance">Date de départ</Label>
                <Input
                  id="edit-last-quittance"
                  type="date"
                  value={lastQuittanceDate}
                  onChange={(e) => setLastQuittanceDate(e.target.value)}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {saved ? (
              <p className="text-sm text-primary">
                Modifications enregistrées.
              </p>
            ) : null}

            <div>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Augmentations de loyer */}
      <Card>
        <CardHeader>
          <CardTitle>Augmentations de loyer</CardTitle>
          <CardDescription>
            Le loyer et les charges de base s&apos;appliquent tant
            qu&apos;aucune augmentation n&apos;est enregistrée pour une période
            donnée.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {rentHistory.length > 0 ? (
            <ul className="grid gap-2">
              {[...rentHistory]
                .sort((a, b) => (a.effectiveMonth < b.effectiveMonth ? 1 : -1))
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
                      onClick={() =>
                        persistRentHistory(
                          rentHistory.filter((e) => e.id !== entry.id)
                        )
                      }
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
                onChange={(e) => setNewEffectiveMonth(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rent-change-rent">Nouveau loyer (€)</Label>
              <Input
                id="rent-change-rent"
                inputMode="decimal"
                value={newRentAmount}
                onChange={(e) => setNewRentAmount(e.target.value)}
                placeholder="680,00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rent-change-charges">Nouvelles charges (€)</Label>
              <Input
                id="rent-change-charges"
                inputMode="decimal"
                value={newChargesAmount}
                onChange={(e) => setNewChargesAmount(e.target.value)}
                placeholder="55,00"
              />
            </div>
          </div>

          {historyError ? (
            <p className="text-sm text-destructive">{historyError}</p>
          ) : null}

          <div>
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
        </CardContent>
      </Card>

      {/* Zone dangereuse */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Zone dangereuse</CardTitle>
          <CardDescription>
            La suppression est définitive et entraîne la suppression de toutes
            les quittances associées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deleteError ? (
            <p className="mb-3 text-sm text-destructive">{deleteError}</p>
          ) : null}
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            Supprimer ce locataire
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Supprimer {tenant.civility} {tenant.name} ?
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Elle supprimera définitivement le
              locataire{" "}
              <span className="font-medium text-foreground">
                {tenant.civility} {tenant.name}
              </span>{" "}
              ainsi que toutes ses quittances enregistrées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
