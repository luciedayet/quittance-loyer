"use client"

import Link from "next/link"
import { useRef, useState } from "react"

import { LogoutButton } from "@/components/auth/logout-button"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Profile } from "@/lib/profiles"
import { cn } from "@/lib/utils"

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
    profile.property.shortAddress ?? "",
  )
  const [propertyLines, setPropertyLines] = useState(
    linesToText(profile.property.lines),
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [signatureSrc, setSignatureSrc] = useState(profile.signatureSrc)
  const [isUploadingSignature, setIsUploadingSignature] = useState(false)
  const [signatureError, setSignatureError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function compressSignature(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const img = document.createElement("img")
        img.onload = () => {
          const MAX_W = 360
          const MAX_H = 120
          let { width, height } = img
          const ratio = Math.min(MAX_W / width, MAX_H / height, 1)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) { reject(new Error("Canvas non disponible.")); return }
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/png"))
        }
        img.onerror = () => reject(new Error("Impossible de lire l'image."))
        img.src = evt.target?.result as string
      }
      reader.onerror = () => reject(new Error("Impossible de lire le fichier."))
      reader.readAsDataURL(file)
    })
  }

  async function handleSignatureChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    if (!file) return
    setIsUploadingSignature(true)
    setSignatureError(null)
    try {
      const dataUrl = await compressSignature(file)
      const response = await fetch(`/api/profiles/${profile.id}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl: dataUrl }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error ?? "Erreur lors de l'envoi.")
      }
      setSignatureSrc((data as typeof profile).signatureSrc)
    } catch (cause) {
      setSignatureError(
        cause instanceof Error ? cause.message : "Erreur lors de l'envoi.",
      )
    } finally {
      setIsUploadingSignature(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleRemoveSignature() {
    setIsUploadingSignature(true)
    setSignatureError(null)
    try {
      const response = await fetch(`/api/profiles/${profile.id}/signature`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Erreur lors de la suppression.")
      setSignatureSrc(null)
    } catch (cause) {
      setSignatureError(
        cause instanceof Error ? cause.message : "Erreur lors de la suppression.",
      )
    } finally {
      setIsUploadingSignature(false)
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
          data?.error ?? "Erreur lors de la mise à jour de la SCI.",
        )
      }
      setProfile(data as Profile)
      setSaved(true)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de l'enregistrement.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <div className="space-y-2">
        <Link
          href={`/${profile.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← Retour à {profile.sciName}
        </Link>
        <h1 className="font-heading text-2xl font-medium">Profil</h1>
      </div>

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
              disabled={isUploadingSignature}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploadingSignature
                ? "Envoi…"
                : signatureSrc
                  ? "Remplacer la signature"
                  : "Ajouter une signature"}
            </Button>
            {signatureSrc ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                disabled={isUploadingSignature}
                onClick={handleRemoveSignature}
              >
                Supprimer
              </Button>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleSignatureChange}
          />
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
