"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

import { EditQuittanceDialog } from "@/components/tenants/edit-quittance-dialog"
import { TenantAvatar } from "@/components/tenants/tenant-avatar"
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
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import { useQuittancePdf } from "@/components/pdf/use-quittance-pdf"
import type { QuittanceRecord } from "@/lib/notion/quittances"
import type { Profile } from "@/lib/profiles"
import {
  buildQuittanceFields,
  buildQuittanceFilename,
  defaultIssueDate,
  formatEuros,
  formatIsoDate,
  isValidIsoDate,
  monthFromDate,
  todayIsoDate,
} from "@/lib/quittance"
import { effectiveRateAt, type Tenant } from "@/lib/tenants"
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

type GenerationFormProps = {
  profile: Profile
  tenant: Tenant
  onLogged: () => void
}

function GenerationForm({ profile, tenant, onLogged }: GenerationFormProps) {
  const today = todayIsoDate()
  const currentMonth = monthFromDate(today)

  const [periodMonth, setPeriodMonth] = useState(currentMonth)
  const [paymentDate, setPaymentDate] = useState(today)
  const [issueDate, setIssueDate] = useState(() => defaultIssueDate(currentMonth))
  const [isLogging, setIsLogging] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)

  const { previewUrl, isGenerating, error, generate, download } = useQuittancePdf()

  const fields = useMemo(
    () => buildQuittanceFields(profile, tenant, paymentDate, periodMonth, issueDate),
    [profile, tenant, paymentDate, periodMonth, issueDate],
  )

  useEffect(() => {
    if (!fields) return
    const timer = setTimeout(() => {
      generate(fields)
    }, 600)
    return () => clearTimeout(timer)
  }, [fields, generate])

  async function handleGenerate() {
    if (!fields) return
    setLogError(null)
    setIsLogging(true)
    try {
      await download(fields)
      await fetch("/api/quittances", {
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
      onLogged()
    } catch {
      setLogError("Erreur lors de la génération.")
    } finally {
      setIsLogging(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Formulaire */}
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="gen-period-month">Mois concerné</Label>
            <Input
              id="gen-period-month"
              type="month"
              value={periodMonth}
              onChange={(event) => {
                const next = event.target.value
                setPeriodMonth(next)
                setIssueDate(defaultIssueDate(next))
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gen-payment-date">Date de paiement</Label>
            <Input
              id="gen-payment-date"
              type="date"
              value={paymentDate}
              onChange={(event) => {
                const next = event.target.value
                setPaymentDate(next)
                if (isValidIsoDate(next)) {
                  const nextMonth = monthFromDate(next)
                  setPeriodMonth(nextMonth)
                  setIssueDate(defaultIssueDate(nextMonth))
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gen-issue-date">Date de génération</Label>
            <Input
              id="gen-issue-date"
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

        {logError ? (
          <p className="text-sm text-destructive">{logError}</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || isLogging || !fields}
          className="self-start"
        >
          {isGenerating || isLogging ? "Génération…" : "Générer la quittance"}
        </Button>
      </div>

      {/* Aperçu */}
      <div className="hidden lg:flex lg:flex-col lg:gap-2">
        <p className="text-sm font-medium text-muted-foreground">Aperçu</p>
        {previewUrl ? (
          <iframe
            title="Aperçu de la quittance"
            src={previewUrl}
            className="h-[500px] w-full rounded-2xl border border-border bg-white"
          />
        ) : (
          <div className="flex h-[500px] items-center justify-center rounded-2xl border border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {isGenerating ? "Génération de l'aperçu…" : "L'aperçu apparaîtra ici."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function TenantQuittancesView({
  profile,
  tenant,
  initialQuittances,
  readOnly = false,
}: TenantQuittancesViewProps) {
  const [quittances, setQuittances] = useState(initialQuittances)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [editingQuittance, setEditingQuittance] =
    useState<QuittanceRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { download } = useQuittancePdf()
  const currentRate = effectiveRateAt(tenant, monthFromDate(todayIsoDate()))

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

        <div className="flex items-center gap-3">
          <TenantAvatar seed={tenant.avatarSeed} name={tenant.name} size="lg" />
          <div>
            <h1 className="font-heading text-2xl font-medium">
              {tenant.civility} {tenant.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile.sciName} · Loyer{" "}
              {formatEuros(currentRate.rentAmount)} € + charges{" "}
              {formatEuros(currentRate.chargesAmount)} €
            </p>
          </div>
        </div>
      </div>

      {readOnly ? (
        <QuittancesListCard
          quittances={quittances}
          readOnly
          downloadingId={downloadingId}
          deletingId={deletingId}
          onDownload={handleDownload}
          onEdit={setEditingQuittance}
          onDelete={handleDeleteQuittance}
        />
      ) : (
        <Tabs defaultValue="generer">
          <TabsList>
            <TabsTab value="generer">À générer</TabsTab>
            <TabsTab value="generees">
              Générées
              {quittances.length > 0 ? (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {quittances.length}
                </span>
              ) : null}
            </TabsTab>
          </TabsList>

          <TabsPanel value="generer">
            <GenerationForm
              profile={profile}
              tenant={tenant}
              onLogged={refreshQuittances}
            />
          </TabsPanel>

          <TabsPanel value="generees">
            <QuittancesListCard
              quittances={quittances}
              readOnly={false}
              downloadingId={downloadingId}
              deletingId={deletingId}
              onDownload={handleDownload}
              onEdit={setEditingQuittance}
              onDelete={handleDeleteQuittance}
            />
          </TabsPanel>
        </Tabs>
      )}

      {!readOnly && editingQuittance ? (
        <EditQuittanceDialog
          key={editingQuittance.id}
          open={Boolean(editingQuittance)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setEditingQuittance(null)
          }}
          quittance={editingQuittance}
          onSubmit={handleEditSubmit}
        />
      ) : null}
    </div>
  )
}

type QuittancesListCardProps = {
  quittances: QuittanceRecord[]
  readOnly: boolean
  downloadingId: string | null
  deletingId: string | null
  onDownload: (quittance: QuittanceRecord) => void
  onEdit: (quittance: QuittanceRecord) => void
  onDelete: (quittance: QuittanceRecord) => void
}

function QuittancesListCard({
  quittances,
  readOnly,
  downloadingId,
  deletingId,
  onDownload,
  onEdit,
  onDelete,
}: QuittancesListCardProps) {
  return (
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
                      !quittance.paymentDate || downloadingId === quittance.id
                    }
                    onClick={() => onDownload(quittance)}
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
                        onClick={() => onEdit(quittance)}
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
                        onClick={() => onDelete(quittance)}
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
  )
}
