"use client"

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
import type { Tenant, TenantCivility } from "@/lib/tenants"

type TenantUpdate = {
  civility: TenantCivility
  name: string
  rentAmount: number
  chargesAmount: number
}

type EditTenantDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: Tenant | null
  onSubmit: (update: TenantUpdate) => Promise<void>
}

export function EditTenantDialog({
  open,
  onOpenChange,
  tenant,
  onSubmit,
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
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loadedTenantId, setLoadedTenantId] = useState<string | null>(null)

  if (tenant && tenant.id !== loadedTenantId) {
    setLoadedTenantId(tenant.id)
    setCivility(tenant.civility)
    setName(tenant.name)
    setRentAmount(String(tenant.rentAmount))
    setChargesAmount(String(tenant.chargesAmount))
    setError(null)
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

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
