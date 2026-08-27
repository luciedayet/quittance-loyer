"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useCallback, useMemo, useState } from "react"

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
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import { useQuittancePdf } from "@/components/pdf/use-quittance-pdf"
import type { QuittanceRecord } from "@/lib/notion/quittances"
import type { Profile } from "@/lib/profiles"
import {
  arrivalStartMonth,
  buildQuittanceFields,
  departureEndMonth,
  formatEuros,
  formatIsoDate,
  monthFromDate,
  monthsBetweenInclusive,
  periodFromMonth,
  todayIsoDate,
} from "@/lib/quittance"
import { effectiveRateAt, type Tenant } from "@/lib/tenants"
import { cn } from "@/lib/utils"

type TenantQuittancesViewProps = {
  profile: Profile
  tenant: Tenant
  initialQuittances: QuittanceRecord[]
  readOnly?: boolean
}

function profileMissingFields(profile: Profile): string[] {
  const missing: string[] = []
  if (!profile.sciName.trim()) missing.push("Nom de la SCI")
  if (!profile.managerName.trim()) missing.push("Nom du gérant")
  if (!profile.city.trim()) missing.push("Ville")
  if (profile.sciAddress.length === 0) missing.push("Adresse de la SCI")
  if (profile.property.lines.length === 0) missing.push("Adresse du bien loué")
  if (!profile.signatureSrc) missing.push("Signature")
  return missing
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
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>()
  const { download, generate } = useQuittancePdf()
  const currentRate = effectiveRateAt(tenant, monthFromDate(todayIsoDate()))

  const missingMonths = useMemo(() => {
    if (!tenant.firstQuittanceDate) return []
    const currentMonth = monthFromDate(todayIsoDate())
    const startMonth = arrivalStartMonth(tenant.firstQuittanceDate)
    const endMonth = departureEndMonth(tenant.lastQuittanceDate, currentMonth)
    if (startMonth > endMonth) return []
    const expected = monthsBetweenInclusive(startMonth, endMonth)
    const existing = new Set(quittances.map((q) => q.periodMonth))
    return expected.filter((m) => !existing.has(m))
  }, [tenant, quittances])

  function openGenerateDialog(month?: string) {
    setSelectedMonth(month)
    setDialogOpen(true)
  }

  async function handleView(quittance: QuittanceRecord) {
    if (!quittance.paymentDate) return
    const fields = buildQuittanceFields(
      profile,
      tenant,
      quittance.paymentDate,
      quittance.periodMonth,
    )
    if (!fields) return
    setViewingId(quittance.id)
    try {
      const blob = await generate(fields)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } finally {
      setViewingId(null)
    }
  }

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
          viewingId={viewingId}
          deletingId={deletingId}
          onView={handleView}
          onDownload={handleDownload}
          onDelete={handleDeleteQuittance}
        />
      ) : (
        <Tabs defaultValue="generer">
          <TabsList>
            <TabsTab value="generer">
              À générer
              {missingMonths.length > 0 ? (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                  {missingMonths.length}
                </span>
              ) : null}
            </TabsTab>
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
            {(() => {
              const missing = profileMissingFields(profile)
              if (missing.length > 0) {
                return (
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-muted text-3xl">
                      ⚙️
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Profil SCI incomplet</p>
                      <p className="text-sm text-muted-foreground">
                        Complétez votre profil SCI pour pouvoir générer des quittances.
                      </p>
                    </div>
                    <ul className="rounded-2xl border border-border bg-muted/40 px-5 py-3 text-left text-sm">
                      {missing.map((field) => (
                        <li key={field} className="flex items-center gap-2 py-0.5 text-muted-foreground">
                          <span className="text-destructive">✗</span> {field} manquant
                          {field === "Signature" ? "e" : ""}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/${profile.id}/profile`}
                      className={cn(buttonVariants({ variant: "default" }))}
                    >
                      Compléter le profil
                    </Link>
                  </div>
                )
              }
              return (
                <MissingMonthsList
                  tenant={tenant}
                  missingMonths={missingMonths}
                  onGenerate={openGenerateDialog}
                />
              )
            })()}
          </TabsPanel>

          <TabsPanel value="generees">
            <QuittancesListCard
              quittances={quittances}
              readOnly={false}
              downloadingId={downloadingId}
              viewingId={viewingId}
              deletingId={deletingId}
              onView={handleView}
              onDownload={handleDownload}
              onDelete={handleDeleteQuittance}
            />
          </TabsPanel>
        </Tabs>
      )}

      <QuittanceDialog
        key={`${tenant.id}-${selectedMonth ?? "open"}-${dialogOpen}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={profile}
        tenant={tenant}
        initialPeriodMonth={selectedMonth}
        onLogged={refreshQuittances}
      />

    </div>
  )
}

type MissingMonthsListProps = {
  tenant: Tenant
  missingMonths: string[]
  onGenerate: (month: string) => void
}

function MissingMonthsList({
  tenant,
  missingMonths,
  onGenerate,
}: MissingMonthsListProps) {
  if (!tenant.firstQuittanceDate) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune date de première quittance renseignée.
      </p>
    )
  }

  if (missingMonths.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Toutes les quittances sont à jour.
      </p>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quittances manquantes</CardTitle>
        <CardDescription>
          {missingMonths.length} quittance
          {missingMonths.length > 1 ? "s" : ""} à générer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {missingMonths.map((month) => (
            <li
              key={month}
              className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
            >
              <span className="text-sm capitalize">
                {periodFromMonth(month)?.label ?? month}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onGenerate(month)}
              >
                Générer
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

type QuittancesListCardProps = {
  quittances: QuittanceRecord[]
  readOnly: boolean
  downloadingId: string | null
  viewingId: string | null
  deletingId: string | null
  onView: (quittance: QuittanceRecord) => void
  onDownload: (quittance: QuittanceRecord) => void
  onDelete: (quittance: QuittanceRecord) => void
}

function QuittancesListCard({
  quittances,
  readOnly,
  downloadingId,
  viewingId,
  deletingId,
  onView,
  onDownload,
  onDelete,
}: QuittancesListCardProps) {
  const years = [...new Set(quittances.map((q) => q.periodMonth.slice(0, 4)))].sort(
    (a, b) => b.localeCompare(a),
  )

  function QuittancesList({ list }: { list: QuittanceRecord[] }) {
    return (
      <ul className="divide-y divide-border">
        {list.map((quittance) => (
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
                disabled={!quittance.paymentDate || viewingId === quittance.id}
                onClick={() => onView(quittance)}
              >
                {viewingId === quittance.id ? "Génération…" : "Voir"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  !quittance.paymentDate || downloadingId === quittance.id
                }
                onClick={() => onDownload(quittance)}
              >
                {downloadingId === quittance.id ? "Génération…" : "Télécharger"}
              </Button>
              {readOnly ? null : (
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
                    Supprimer la quittance de {periodLabel(quittance.periodMonth)}
                  </span>
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (quittances.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune quittance générée pour l&apos;instant.
      </p>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue={years[0]}>
          <TabsList className="mb-4">
            {years.map((year) => (
              <TabsTab key={year} value={year}>
                {year}
              </TabsTab>
            ))}
          </TabsList>
          {years.map((year) => (
            <TabsPanel key={year} value={year}>
              <QuittancesList
                list={quittances.filter((q) => q.periodMonth.startsWith(year))}
              />
            </TabsPanel>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
