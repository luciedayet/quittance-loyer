"use client"

import { useEffect, useMemo, useState } from "react"

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
  defaultIssueDate,
  isValidIsoDate,
  isValidPeriodMonth,
  monthFromDate,
  periodFromMonth,
  todayIsoDate,
} from "@/lib/quittance"
import type { Profile } from "@/lib/profiles"
import type { Tenant } from "@/lib/tenants"
import { toastManager } from "@/lib/toast-manager"

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
    hasInitialPeriod ? `${initialPeriodMonth}-01` : todayIsoDate()
  )
  const [periodMonth, setPeriodMonth] = useState(() =>
    hasInitialPeriod ? initialPeriodMonth : monthFromDate(todayIsoDate())
  )
  const [issueDate, setIssueDate] = useState(() =>
    defaultIssueDate(
      hasInitialPeriod ? initialPeriodMonth : monthFromDate(todayIsoDate())
    )
  )
  const {
    previewUrl,
    isGenerating,
    error: previewError,
    generate,
    revokePreview,
  } = useQuittancePdf()
  const [isLogging, setIsLogging] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) revokePreview()
    onOpenChange(nextOpen)
  }

  const fields = useMemo(() => {
    if (!tenant) return null
    return buildQuittanceFields(
      profile,
      tenant,
      paymentDate,
      periodMonth,
      issueDate
    )
  }, [paymentDate, periodMonth, issueDate, profile, tenant])

  useEffect(() => {
    if (!fields) return
    const timer = setTimeout(() => {
      generate(fields)
    }, 600)
    return () => clearTimeout(timer)
  }, [fields, generate])

  async function handleGenerate() {
    if (!fields) return
    setIsLogging(true)
    setLogError(null)
    try {
      const response = await fetch("/api/quittances", {
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
      if (!response.ok) throw new Error("Erreur lors de l'enregistrement.")
      onLogged?.()
      handleOpenChange(false)
      toastManager.add({
        title: "Quittance générée",
        description: tenant
          ? `${tenant.civility} ${tenant.name} · ${
              periodFromMonth(periodMonth)?.label ?? periodMonth
            }`
          : undefined,
        type: "success",
      })
    } catch (cause) {
      setLogError(
        cause instanceof Error
          ? cause.message
          : "Erreur lors de l'enregistrement."
      )
    } finally {
      setIsLogging(false)
    }
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
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="d-payment-date">Date de paiement</Label>
                <Input
                  id="d-payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(event) => {
                    const nextDate = event.target.value
                    setPaymentDate(nextDate)
                    if (isValidIsoDate(nextDate)) {
                      const nextMonth = monthFromDate(nextDate)
                      setPeriodMonth(nextMonth)
                      setIssueDate(defaultIssueDate(nextMonth))
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="d-period-month">Mois concerné</Label>
                <Input
                  id="d-period-month"
                  type="month"
                  value={periodMonth}
                  onChange={(event) => {
                    setPeriodMonth(event.target.value)
                    setIssueDate(defaultIssueDate(event.target.value))
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="d-issue-date">Date de génération</Label>
                <Input
                  id="d-issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(event) => setIssueDate(event.target.value)}
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
                  {fields.rentFormatted} € + charges {fields.chargesFormatted} €
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
                className="hidden h-[360px] w-full rounded-2xl border border-border bg-white sm:block"
              />
            ) : isGenerating ? (
              <div className="hidden h-[360px] w-full items-center justify-center rounded-2xl border border-border bg-muted/30 sm:flex">
                <p className="text-sm text-muted-foreground">
                  Génération de l&apos;aperçu…
                </p>
              </div>
            ) : null}

            {previewError ? (
              <p className="text-sm text-destructive">{previewError}</p>
            ) : null}
            {logError ? (
              <p className="text-sm text-destructive">{logError}</p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="sm:hidden"
                disabled={isGenerating || !previewUrl}
                onClick={() => {
                  if (previewUrl) window.open(previewUrl, "_blank")
                }}
              >
                {isGenerating ? "Génération…" : "Aperçu"}
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || isLogging || !fields}
              >
                {isLogging ? "Enregistrement…" : "Générer la quittance"}
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
