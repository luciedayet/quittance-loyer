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
import type { QuittanceRecord } from "@/lib/notion/quittances"

type QuittanceUpdate = {
  periodMonth: string
  paymentDate: string
  totalAmount: number
}

type EditQuittanceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  quittance: QuittanceRecord
  onSubmit: (update: QuittanceUpdate) => Promise<void>
}

export function EditQuittanceDialog({
  open,
  onOpenChange,
  quittance,
  onSubmit,
}: EditQuittanceDialogProps) {
  const [periodMonth, setPeriodMonth] = useState(quittance.periodMonth)
  const [paymentDate, setPaymentDate] = useState(quittance.paymentDate ?? "")
  const [totalAmount, setTotalAmount] = useState(
    String(quittance.totalAmount).replace(".", ","),
  )
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = Number.parseFloat(totalAmount.replace(",", "."))

    if (!paymentDate) {
      setError("La date de paiement est requise.")
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Le montant total doit être un montant positif.")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSubmit({ periodMonth, paymentDate, totalAmount: amount })
      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la quittance</DialogTitle>
          <DialogDescription>
            Corrige le mois, la date de paiement ou le montant enregistrés.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="quittance-period">Mois concerné</Label>
              <Input
                id="quittance-period"
                type="month"
                value={periodMonth}
                onChange={(event) => setPeriodMonth(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quittance-payment-date">Date de paiement</Label>
              <Input
                id="quittance-payment-date"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quittance-total">Montant total (€)</Label>
            <Input
              id="quittance-total"
              inputMode="decimal"
              value={totalAmount}
              onChange={(event) => setTotalAmount(event.target.value)}
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
