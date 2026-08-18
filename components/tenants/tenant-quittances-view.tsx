"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useCallback, useState } from "react"

import { EditQuittanceDialog } from "@/components/tenants/edit-quittance-dialog"
import { QuittanceDialog } from "@/components/tenants/quittance-dialog"
import { TenantAvatar } from "@/components/tenants/tenant-avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useQuittancePdf } from "@/components/pdf/use-quittance-pdf"
import type { QuittanceRecord } from "@/lib/notion/quittances"
import type { Profile } from "@/lib/profiles"
import {
  buildQuittanceFields,
  formatEuros,
  formatIsoDate,
} from "@/lib/quittance"
import type { Tenant } from "@/lib/tenants"
import { cn } from "@/lib/utils"

type TenantQuittancesViewProps = {
  profile: Profile
  tenant: Tenant
  initialQuittances: QuittanceRecord[]
  /** Vrai pour un vrai locataire ou un admin qui l'impersonne. */
  readOnly?: boolean
}

function periodLabel(periodMonth: string): string {
  if (!/^\d{4}-\d{2}$/.test(periodMonth)) return periodMonth
  const [year, month] = periodMonth.split("-")
  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date)
}

export function TenantQuittancesView({
  profile,
  tenant,
  initialQuittances,
  readOnly = false,
}: TenantQuittancesViewProps) {
  const [quittances, setQuittances] = useState(initialQuittances)
  const [quittanceDialogOpen, setQuittanceDialogOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [editingQuittance, setEditingQuittance] =
    useState<QuittanceRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { download } = useQuittancePdf()

  async function handleDownload(quittance: QuittanceRecord) {
    if (!quittance.paymentDate) return
    const fields = buildQuittanceFields(
      profile,
      tenant,
      quittance.paymentDate,
      quittance.periodMonth,
    )
    if (!fields) return

    setDownloadingId(quittance.id)
    try {
      await download(fields)
    } finally {
      setDownloadingId(null)
    }
  }

  const refreshQuittances = useCallback(async () => {
    const response = await fetch(
      `/api/quittances?tenantId=${encodeURIComponent(tenant.id)}`,
    )
    if (!response.ok) return
    const data = await response.json()
    setQuittances(data.quittances as QuittanceRecord[])
  }, [tenant.id])

  async function handleEditSubmit(update: {
    periodMonth: string
    paymentDate: string
    totalAmount: number
  }) {
    if (!editingQuittance) return
    const response = await fetch(`/api/quittances/${editingQuittance.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error ?? "Erreur lors de la mise à jour.")
    }
    await refreshQuittances()
  }

  async function handleDeleteQuittance(quittance: QuittanceRecord) {
    if (
      !window.confirm(
        `Supprimer la quittance de ${periodLabel(quittance.periodMonth)} ?`,
      )
    ) {
      return
    }

    setDeletingId(quittance.id)
    try {
      const response = await fetch(`/api/quittances/${quittance.id}`, {
        method: "DELETE",
      })
      if (!response.ok) return
      await refreshQuittances()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <div className="space-y-2">
        {readOnly ? null : (
          <Link
            href={`/${profile.id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            ← Retour aux locataires
          </Link>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <TenantAvatar seed={tenant.avatarSeed} name={tenant.name} size="lg" />
            <div>
              <h1 className="font-heading text-2xl font-medium">
                {tenant.civility} {tenant.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {profile.sciName} · Loyer {formatEuros(tenant.rentAmount)} € +
                charges {formatEuros(tenant.chargesAmount)} €
              </p>
            </div>
          </div>
          {readOnly ? null : (
            <Button onClick={() => setQuittanceDialogOpen(true)}>
              Générer une quittance
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des quittances</CardTitle>
          <CardDescription>
            {quittances.length === 0
              ? "Aucune quittance générée pour l'instant."
              : `${quittances.length} quittance${quittances.length > 1 ? "s" : ""} générée${quittances.length > 1 ? "s" : ""}.`}
          </CardDescription>
        </CardHeader>
        {quittances.length > 0 ? (
          <CardContent>
            <ul className="divide-y divide-border">
              {quittances.map((quittance) => (
                <li
                  key={quittance.id}
                  className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium capitalize">
                      {periodLabel(quittance.periodMonth)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Payée le{" "}
                      {quittance.paymentDate
                        ? formatIsoDate(quittance.paymentDate)
                        : "date inconnue"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">
                      {formatEuros(quittance.totalAmount)} €
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        !quittance.paymentDate ||
                        downloadingId === quittance.id
                      }
                      onClick={() => handleDownload(quittance)}
                    >
                      {downloadingId === quittance.id
                        ? "Génération…"
                        : "Télécharger"}
                    </Button>
                    {readOnly ? null : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="bg-secondary"
                          onClick={() => setEditingQuittance(quittance)}
                        >
                          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                          <span className="sr-only">
                            Modifier la quittance de{" "}
                            {periodLabel(quittance.periodMonth)}
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="bg-secondary text-destructive"
                          disabled={deletingId === quittance.id}
                          onClick={() => handleDeleteQuittance(quittance)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                          <span className="sr-only">
                            Supprimer la quittance de{" "}
                            {periodLabel(quittance.periodMonth)}
                          </span>
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        ) : null}
      </Card>

      {readOnly ? null : (
        <QuittanceDialog
          open={quittanceDialogOpen}
          onOpenChange={setQuittanceDialogOpen}
          profile={profile}
          tenant={tenant}
          onLogged={refreshQuittances}
        />
      )}

      {readOnly || !editingQuittance ? null : (
        <EditQuittanceDialog
          key={editingQuittance.id}
          open={Boolean(editingQuittance)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setEditingQuittance(null)
          }}
          quittance={editingQuittance}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  )
}
