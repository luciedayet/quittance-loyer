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
import { Textarea } from "@/components/ui/textarea"
import type { Profile } from "@/lib/profiles"

type ProfileUpdate = {
  sciName: string
  managerName: string
  city: string
  sciAddress: string[]
  propertyShortAddress: string
  propertyLines: string[]
}

type EditProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
  onSubmit: (update: ProfileUpdate) => Promise<void>
}

function linesToText(lines: string[]): string {
  return lines.join("\n")
}

function textToLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onSubmit,
}: EditProfileDialogProps) {
  const [sciName, setSciName] = useState(profile.sciName)
  const [managerName, setManagerName] = useState(profile.managerName)
  const [city, setCity] = useState(profile.city)
  const [sciAddress, setSciAddress] = useState(
    linesToText(profile.sciAddress),
  )
  const [propertyShortAddress, setPropertyShortAddress] = useState(
    profile.property.shortAddress ?? "",
  )
  const [propertyLines, setPropertyLines] = useState(
    linesToText(profile.property.lines),
  )
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function resetForm() {
    setSciName(profile.sciName)
    setManagerName(profile.managerName)
    setCity(profile.city)
    setSciAddress(linesToText(profile.sciAddress))
    setPropertyShortAddress(profile.property.shortAddress ?? "")
    setPropertyLines(linesToText(profile.property.lines))
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const addressLines = textToLines(sciAddress)
    const propertyAddressLines = textToLines(propertyLines)

    if (!sciName.trim()) {
      setError("Le nom de la SCI est requis.")
      return
    }
    if (!managerName.trim()) {
      setError("Le nom du gérant est requis.")
      return
    }
    if (!city.trim()) {
      setError("La ville est requise.")
      return
    }
    if (addressLines.length === 0) {
      setError("L'adresse de la SCI est requise.")
      return
    }
    if (propertyAddressLines.length === 0) {
      setError("L'adresse du bien loué est requise.")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSubmit({
        sciName: sciName.trim(),
        managerName: managerName.trim(),
        city: city.trim(),
        sciAddress: addressLines,
        propertyShortAddress: propertyShortAddress.trim(),
        propertyLines: propertyAddressLines,
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier la SCI</DialogTitle>
          <DialogDescription>
            Ces informations sont utilisées sur les quittances générées pour
            cette SCI.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="profile-sci-name">Nom de la SCI</Label>
              <Input
                id="profile-sci-name"
                value={sciName}
                onChange={(event) => setSciName(event.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-manager-name">Gérant</Label>
              <Input
                id="profile-manager-name"
                value={managerName}
                onChange={(event) => setManagerName(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-sci-address">
              Adresse de la SCI (une ligne par ligne d&apos;adresse)
            </Label>
            <Textarea
              id="profile-sci-address"
              value={sciAddress}
              onChange={(event) => setSciAddress(event.target.value)}
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-city">Ville</Label>
            <Input
              id="profile-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-property-short">
              Libellé court du bien (optionnel)
            </Label>
            <Input
              id="profile-property-short"
              value={propertyShortAddress}
              onChange={(event) => setPropertyShortAddress(event.target.value)}
              placeholder="Appartement 3, Bâtiment A"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-property-lines">
              Adresse du bien loué (une ligne par ligne d&apos;adresse)
            </Label>
            <Textarea
              id="profile-property-lines"
              value={propertyLines}
              onChange={(event) => setPropertyLines(event.target.value)}
              rows={3}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
