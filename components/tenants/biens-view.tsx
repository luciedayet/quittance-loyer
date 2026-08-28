"use client"

import { useState } from "react"

import { BienDialog } from "@/components/tenants/bien-dialog"
import { useBiensContext } from "@/components/tenants/biens-context"
import { useTenantsContext } from "@/components/tenants/tenants-context"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Bien } from "@/lib/biens"

export function BiensView() {
  const { biens, isLoaded, addBien, updateBien, removeBien } = useBiensContext()
  const { tenants } = useTenantsContext()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBien, setEditingBien] = useState<Bien | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openAddDialog() {
    setEditingBien(null)
    setDialogOpen(true)
  }

  function openEditDialog(bien: Bien) {
    setEditingBien(bien)
    setDialogOpen(true)
  }

  async function handleSubmit(input: {
    name: string
    shortAddress?: string
    lines: string[]
  }) {
    if (editingBien) {
      await updateBien(editingBien.id, input)
    } else {
      await addBien(input)
    }
  }

  async function handleDelete(bien: Bien) {
    const tenantCount = tenants.filter((t) => t.bienId === bien.id).length
    if (tenantCount > 0) {
      window.alert(
        `Ce bien a ${tenantCount} locataire${tenantCount > 1 ? "s" : ""}. Réassignez-les d'abord dans l'onglet Locataires.`
      )
      return
    }
    if (!window.confirm(`Supprimer « ${bien.name} » ?`)) return
    setDeletingId(bien.id)
    setError(null)
    try {
      await removeBien(bien.id)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de la suppression."
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (!isLoaded) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button type="button" size="sm" onClick={openAddDialog}>
          + Ajouter un bien
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {biens.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-3xl">
            🏠
          </div>
          <div className="space-y-1">
            <p className="font-medium">Aucun bien pour l&apos;instant</p>
            <p className="text-sm text-muted-foreground">
              Ajoutez un bien pour pouvoir y rattacher des locataires.
            </p>
          </div>
          <Button type="button" onClick={openAddDialog}>
            + Ajouter un bien
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {biens.map((bien) => {
            const tenantCount = tenants.filter(
              (t) => t.bienId === bien.id
            ).length
            return (
              <Card key={bien.id}>
                <CardHeader>
                  <CardTitle>{bien.name}</CardTitle>
                  <CardDescription>
                    {tenantCount} locataire{tenantCount > 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {bien.lines.length > 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {bien.shortAddress ? (
                        <p className="font-medium text-foreground">
                          {bien.shortAddress}
                        </p>
                      ) : null}
                      {bien.lines.map((line, index) => (
                        <p key={`${bien.id}-${index}`}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucune adresse renseignée.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(bien)}
                    >
                      Modifier
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={deletingId === bien.id}
                      onClick={() => handleDelete(bien)}
                    >
                      {deletingId === bien.id ? "Suppression…" : "Supprimer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <BienDialog
        key={editingBien?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bien={editingBien}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
