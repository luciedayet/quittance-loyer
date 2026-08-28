"use client"

import { useState } from "react"

import { LogoutButton } from "@/components/auth/logout-button"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SignaturePad } from "@/components/ui/signature-pad"
import { Textarea } from "@/components/ui/textarea"
import type { Profile } from "@/lib/profiles"

type ProfileSettingsViewProps = {
  profile: Profile
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

export function ProfileSettingsView({
  profile: initialProfile,
}: ProfileSettingsViewProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [sciName, setSciName] = useState(profile.sciName)
  const [managerName, setManagerName] = useState(profile.managerName)
  const [city, setCity] = useState(profile.city)
  const [sciAddress, setSciAddress] = useState(linesToText(profile.sciAddress))
  const [propertyShortAddress, setPropertyShortAddress] = useState(
    profile.property.shortAddress ?? ""
  )
  const [propertyLines, setPropertyLines] = useState(
    linesToText(profile.property.lines)
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [signatureSrc, setSignatureSrc] = useState(profile.signatureSrc)
  const [showPad, setShowPad] = useState(false)
  const [isSavingSignature, setIsSavingSignature] = useState(false)
  const [signatureError, setSignatureError] = useState<string | null>(null)

  async function handleSaveSignature(dataUrl: string) {
    setIsSavingSignature(true)
    setSignatureError(null)
    try {
      const response = await fetch(`/api/profiles/${profile.id}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl: dataUrl }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error ?? "Erreur lors de l'enregistrement.")
      }
      setSignatureSrc((data as typeof profile).signatureSrc)
      setShowPad(false)
    } catch (cause) {
      setSignatureError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de l'enregistrement."
      )
    } finally {
      setIsSavingSignature(false)
    }
  }

  async function handleRemoveSignature() {
    setIsSavingSignature(true)
    setSignatureError(null)
    try {
      const response = await fetch(`/api/profiles/${profile.id}/signature`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Erreur lors de la suppression.")
      setSignatureSrc(null)
      setShowPad(false)
    } catch (cause) {
      setSignatureError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de la suppression."
      )
    } finally {
      setIsSavingSignature(false)
    }
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
    setSaved(false)

    try {
      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sciName: sciName.trim(),
          managerName: managerName.trim(),
          city: city.trim(),
          sciAddress: addressLines,
          propertyShortAddress: propertyShortAddress.trim(),
          propertyLines: propertyAddressLines,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(
          data?.error ?? "Erreur lors de la mise à jour de la SCI."
        )
      }
      setProfile(data as Profile)
      setSaved(true)
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

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Informations de la SCI</CardTitle>
          <CardDescription>
            Ces informations sont utilisées sur les quittances générées pour
            cette SCI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="profile-sci-name">Nom de la SCI</Label>
                <Input
                  id="profile-sci-name"
                  value={sciName}
                  onChange={(event) => setSciName(event.target.value)}
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
                onChange={(event) =>
                  setPropertyShortAddress(event.target.value)
                }
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

      <Card>
        <CardHeader>
          <CardTitle>Signature</CardTitle>
          <CardDescription>
            Votre signature apparaîtra en bas des quittances générées.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!showPad ? (
            <>
              {signatureSrc ? (
                <div className="inline-block rounded-2xl border border-border bg-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signatureSrc}
                    alt="Signature"
                    className="max-h-[80px] max-w-[300px] object-contain"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune signature enregistrée.
                </p>
              )}

              {signatureError ? (
                <p className="text-sm text-destructive">{signatureError}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSignatureError(null)
                    setShowPad(true)
                  }}
                >
                  {signatureSrc
                    ? "Redessiner la signature"
                    : "Dessiner la signature"}
                </Button>
                {signatureSrc ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    disabled={isSavingSignature}
                    onClick={handleRemoveSignature}
                  >
                    {isSavingSignature ? "Suppression…" : "Supprimer"}
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {signatureError ? (
                <p className="text-sm text-destructive">{signatureError}</p>
              ) : null}
              <SignaturePad
                onSave={handleSaveSignature}
                onCancel={() => setShowPad(false)}
                isSaving={isSavingSignature}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  )
}
