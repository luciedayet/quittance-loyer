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
import type { TenantCivility } from "@/lib/tenants"

type AddTenantDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableLocations: string[]
  onSubmit: (input: {
    civility: TenantCivility
    name: string
    rentAmount: number
    chargesAmount: number
    firstQuittanceDate: string | null
    lastQuittanceDate: string | null
    location: string | null
  }) => void
}

export function AddTenantDialog({
  open,
  onOpenChange,
  availableLocations,
  onSubmit,
}: AddTenantDialogProps) {
  const [civility, setCivility] = useState<TenantCivility>("M.")
  const [name, setName] = useState("")
  const [rentAmount, setRentAmount] = useState("")
  const [chargesAmount, setChargesAmount] = useState("")
  const [firstQuittanceDate, setFirstQuittanceDate] = useState("")
  const [lastQuittanceDate, setLastQuittanceDate] = useState("")
  const [location, setLocation] = useState("")
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setCivility("M.")
    setName("")
    setRentAmount("")
    setChargesAmount("")
    setFirstQuittanceDate("")
    setLastQuittanceDate("")
    setLocation("")
    setError(null)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    onSubmit({
      civility,
      name: name.trim(),
      rentAmount: rent,
      chargesAmount: charges,
      firstQuittanceDate: firstQuittanceDate || null,
      lastQuittanceDate: lastQuittanceDate || null,
      location: location.trim() || null,
    })
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un locataire</DialogTitle>
          <DialogDescription>
            Les montants seront réutilisés pour chaque quittance de ce
            locataire.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="tenant-civility">Civilité</Label>
            <Select
              value={civility}
              onValueChange={(value) => setCivility(value as TenantCivility)}
            >
              <SelectTrigger id="tenant-civility" className="w-full">
                <SelectValue placeholder="Choisir une civilité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M.">M.</SelectItem>
                <SelectItem value="Mme">Mme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tenant-name">Nom du locataire</Label>
            <Input
              id="tenant-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Dupont"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tenant-rent">Loyer hors charges (€)</Label>
              <Input
                id="tenant-rent"
                inputMode="decimal"
                value={rentAmount}
                onChange={(event) => setRentAmount(event.target.value)}
                placeholder="650,00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenant-charges">Provision pour charges (€)</Label>
              <Input
                id="tenant-charges"
                inputMode="decimal"
                value={chargesAmount}
                onChange={(event) => setChargesAmount(event.target.value)}
                placeholder="50,00"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tenant-location">Lieu</Label>
            <Input
              id="tenant-location"
              list="tenant-location-options"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="ex. Chambre 2"
            />
            <datalist id="tenant-location-options">
              {availableLocations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tenant-first-quittance">
                Première quittance
              </Label>
              <Input
                id="tenant-first-quittance"
                type="date"
                value={firstQuittanceDate}
                onChange={(event) => setFirstQuittanceDate(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenant-last-quittance">Dernière quittance</Label>
              <Input
                id="tenant-last-quittance"
                type="date"
                value={lastQuittanceDate}
                onChange={(event) => setLastQuittanceDate(event.target.value)}
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit">Enregistrer le locataire</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
