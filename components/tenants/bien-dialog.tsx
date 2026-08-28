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
import type { Bien } from "@/lib/biens"

type BienDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bien?: Bien | null
  onSubmit: (input: {
    name: string
    shortAddress?: string
    lines: string[]
  }) => Promise<unknown>
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

export function BienDialog({
  open,
  onOpenChange,
  bien,
  onSubmit,
}: BienDialogProps) {
  const [name, setName] = useState(bien?.name ?? "")
  const [shortAddress, setShortAddress] = useState(bien?.shortAddress ?? "")
  const [lines, setLines] = useState(linesToText(bien?.lines ?? []))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function resetForm() {
    setName(bien?.name ?? "")
    setShortAddress(bien?.shortAddress ?? "")
    setLines(linesToText(bien?.lines ?? []))
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setError("Le nom du bien est requis.")
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        shortAddress: shortAddress.trim() || undefined,
        lines: textToLines(lines),
      })
      handleOpenChange(false)
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {bien ? "Modifier le bien" : "Ajouter un bien"}
          </DialogTitle>
          <DialogDescription>
            L&apos;adresse est utilisée sur les quittances des locataires
            rattachés à ce bien.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="bien-name">Nom du bien</Label>
            <Input
              id="bien-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Appartement principal"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bien-short-address">
              Libellé court (optionnel)
            </Label>
            <Input
              id="bien-short-address"
              value={shortAddress}
              onChange={(event) => setShortAddress(event.target.value)}
              placeholder="Appartement 3, Bâtiment A"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bien-lines">
              Adresse (une ligne par ligne d&apos;adresse)
            </Label>
            <Textarea
              id="bien-lines"
              value={lines}
              onChange={(event) => setLines(event.target.value)}
              rows={3}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Enregistrement..."
                : bien
                  ? "Enregistrer"
                  : "Ajouter le bien"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
