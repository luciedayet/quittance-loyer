"use client"

import { useMemo, useState } from "react"

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
import { useQuittancePdf } from "@/components/pdf/use-quittance-pdf"
import {
  buildQuittanceFields,
  buildQuittanceFilename,
  isValidIsoDate,
  isValidPeriodMonth,
  monthFromDate,
  todayIsoDate,
} from "@/lib/quittance"
import type { Profile } from "@/lib/profiles"
import type { Tenant } from "@/lib/tenants"

type QuittanceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
  tenant: Tenant | null
  onLogged?: () => void
  /** Pré-remplit le mois concerné (relance des quittances manquantes). */
  initialPeriodMonth?: string
}

export function QuittanceDialog({
  open,
  onOpenChange,
  profile,
  tenant,
  onLogged,
  initialPeriodMonth,
}: QuittanceDialogProps) {
  const hasInitialPeriod =
    initialPeriodMonth !== undefined && isValidPeriodMonth(initialPeriodMonth)
  const [paymentDate, setPaymentDate] = useState(() =>
    hasInitialPeriod ? `${initialPeriodMonth}-01` : todayIsoDate(),
  )
  const [periodMonth, setPeriodMonth] = useState(() =>
    hasInitialPeriod ? initialPeriodMonth : monthFromDate(todayIsoDate()),
  )
  const { previewUrl, isGenerating, error, generate, download, revokePreview } =
    useQuittancePdf()

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) revokePreview()
    onOpenChange(nextOpen)
  }

  const fields = useMemo(() => {
    if (!tenant) return null
    return buildQuittanceFields(profile, tenant, paymentDate, periodMonth)
  }, [paymentDate, periodMonth, profile, tenant])

  async function handlePreview() {
    if (!fields) return
    await generate(fields)
  }

  async function handleDownload() {
    if (!fields) return
    await download(fields)

    fetch("/api/quittances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: buildQuittanceFilename(fields),
        profileId: profile.id,
        tenantId: fields.tenant.id,
        periodMonth,
        paymentDate,
        totalAmount: fields.totalAmount,
      }),
    })
      .then(() => onLogged?.())
      .catch(() => {
        // Historique optionnel : une erreur ici ne doit pas bloquer le téléchargement.
      })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Générer une quittance</DialogTitle>
          <DialogDescription>
            {tenant
              ? `${tenant.civility} ${tenant.name} · ${profile.sciName}`
              : "Sélectionnez un locataire"}
          </DialogDescription>
        </DialogHeader>

        {tenant ? (
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="payment-date">Date de paiement</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(event) => {
                    const nextDate = event.target.value
                    setPaymentDate(nextDate)
                    if (isValidIsoDate(nextDate)) {
                      setPeriodMonth(monthFromDate(nextDate))
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="period-month">Mois concerné</Label>
                <Input
                  id="period-month"
                  type="month"
                  value={periodMonth}
                  onChange={(event) => setPeriodMonth(event.target.value)}
                />
              </div>
            </div>

            {fields ? (
              <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed">
                <p>
                  <span className="font-medium">Période :</span> du{" "}
                  {fields.periodStart} au {fields.periodEnd}
                </p>
                <p>
                  <span className="font-medium">Total :</span>{" "}
                  {fields.totalFormatted} € ({fields.amountInWords})
                </p>
                <p>
                  <span className="font-medium">Détail :</span> loyer{" "}
                  {fields.rentFormatted} € + charges{" "}
                  {fields.chargesFormatted} €
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complétez les dates pour afficher le récapitulatif.
              </p>
            )}

            {previewUrl ? (
              <iframe
                title="Aperçu de la quittance"
                src={previewUrl}
                className="hidden h-[420px] w-full rounded-2xl border border-border bg-white sm:block"
              />
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={handlePreview}
                disabled={isGenerating || !fields}
              >
                {isGenerating ? "Génération..." : "Aperçu"}
              </Button>
              <Button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating || !fields}
              >
                Télécharger le PDF
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
