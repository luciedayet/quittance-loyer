"use client"

import { useCallback, useMemo, useState } from "react"

import Link from "next/link"

import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"

import { Accordion } from "@/components/ui/accordion"
import { Button, buttonVariants } from "@/components/ui/button"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs"
import { QuittanceDialog } from "@/components/tenants/quittance-dialog"
import { TenantAvatar } from "@/components/tenants/tenant-avatar"
import { useQuittancePdf } from "@/components/pdf/use-quittance-pdf"
import { useProfileQuittances } from "@/hooks/use-profile-quittances"
import type { QuittanceRecord } from "@/lib/notion/quittances"
import {
  buildQuittanceFields,
  formatEuros,
  formatIsoDate,
  periodFromMonth,
} from "@/lib/quittance"
import {
  computeMissingQuittances,
  countMissingQuittances,
  profileMissingFields,
} from "@/lib/quittances-status"
import type { Profile } from "@/lib/profiles"
import type { Tenant } from "@/lib/tenants"
import { cn } from "@/lib/utils"

type MissingQuittancesViewProps = {
  profile: Profile
  tenants: Tenant[]
  tenantsLoaded: boolean
}

type GroupBy = "tenant" | "month"

function Badge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {count}
    </span>
  )
}

function MonthRow({
  month,
  onGenerate,
}: {
  month: string
  onGenerate: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
      <span className="text-sm capitalize">
        {periodFromMonth(month)?.label ?? month}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={onGenerate}>
        Générer
      </Button>
    </div>
  )
}

function GroupByToggle({
  groupBy,
  onChange,
}: {
  groupBy: GroupBy
  onChange: (groupBy: GroupBy) => void
}) {
  return (
    <div className="flex items-center gap-1 self-start rounded-2xl bg-muted p-1 text-sm">
      <button
        type="button"
        onClick={() => onChange("tenant")}
        className={cn(
          "rounded-xl px-3 py-1 font-medium text-muted-foreground transition-colors",
          groupBy === "tenant" && "bg-background text-foreground shadow-sm"
        )}
      >
        Par locataire
      </button>
      <button
        type="button"
        onClick={() => onChange("month")}
        className={cn(
          "rounded-xl px-3 py-1 font-medium text-muted-foreground transition-colors",
          groupBy === "month" && "bg-background text-foreground shadow-sm"
        )}
      >
        Par mois
      </button>
    </div>
  )
}

function GeneratedQuittanceRow({
  tenant,
  quittance,
  showTenant,
  viewingId,
  downloadingId,
  deletingId,
  onView,
  onDownload,
  onDelete,
}: {
  tenant: Tenant
  quittance: QuittanceRecord
  showTenant: boolean
  viewingId: string | null
  downloadingId: string | null
  deletingId: string | null
  onView: (tenant: Tenant, quittance: QuittanceRecord) => void
  onDownload: (tenant: Tenant, quittance: QuittanceRecord) => void
  onDelete: (quittance: QuittanceRecord) => void
}) {
  const periodLabel =
    periodFromMonth(quittance.periodMonth)?.label ?? quittance.periodMonth
  const paidLabel = quittance.paymentDate
    ? formatIsoDate(quittance.paymentDate)
    : "date inconnue"

  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {showTenant ? (
          <TenantAvatar seed={tenant.avatarSeed} name={tenant.name} size="sm" />
        ) : null}
        <div>
          <p className="text-sm font-medium capitalize">
            {showTenant ? `${tenant.civility} ${tenant.name}` : periodLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {showTenant
              ? `${periodLabel} · Payée le ${paidLabel}`
              : `Payée le ${paidLabel}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">
          {formatEuros(quittance.totalAmount)} €
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!quittance.paymentDate || viewingId === quittance.id}
          onClick={() => onView(tenant, quittance)}
        >
          {viewingId === quittance.id ? "Génération…" : "Voir"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!quittance.paymentDate || downloadingId === quittance.id}
          onClick={() => onDownload(tenant, quittance)}
        >
          {downloadingId === quittance.id ? "Génération…" : "Télécharger"}
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
            Supprimer la quittance de {periodLabel}
          </span>
        </Button>
      </div>
    </li>
  )
}

export function MissingQuittancesView({
  profile,
  tenants,
  tenantsLoaded,
}: MissingQuittancesViewProps) {
  const {
    quittances,
    isLoaded: quittancesLoaded,
    refresh,
  } = useProfileQuittances(profile.id)
  const [groupBy, setGroupBy] = useState<GroupBy>("tenant")
  const [generatedGroupBy, setGeneratedGroupBy] = useState<GroupBy>("tenant")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>()
  const { generate, download } = useQuittancePdf()
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openDialog(tenant: Tenant, month: string) {
    setSelectedTenant(tenant)
    setSelectedMonth(month)
    setDialogOpen(true)
  }

  async function handleView(tenant: Tenant, quittance: QuittanceRecord) {
    if (!quittance.paymentDate) return
    const fields = buildQuittanceFields(
      profile,
      tenant,
      quittance.paymentDate,
      quittance.periodMonth
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

  async function handleDownload(tenant: Tenant, quittance: QuittanceRecord) {
    if (!quittance.paymentDate) return
    const fields = buildQuittanceFields(
      profile,
      tenant,
      quittance.paymentDate,
      quittance.periodMonth
    )
    if (!fields) return
    setDownloadingId(quittance.id)
    try {
      await download(fields)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDeleteQuittance = useCallback(
    async (quittance: QuittanceRecord) => {
      if (
        !window.confirm(
          `Supprimer la quittance de ${
            periodFromMonth(quittance.periodMonth)?.label ??
            quittance.periodMonth
          } ?`
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
        await refresh()
      } finally {
        setDeletingId(null)
      }
    },
    [refresh]
  )

  const missingByTenant = useMemo(
    () => computeMissingQuittances(tenants, quittances),
    [tenants, quittances]
  )

  const missingByMonth = useMemo<{ month: string; tenants: Tenant[] }[]>(() => {
    const map = new Map<string, Tenant[]>()
    for (const { tenant, missingMonths, hasStartDate } of missingByTenant) {
      if (!hasStartDate) continue
      for (const month of missingMonths) {
        const list = map.get(month) ?? []
        list.push(tenant)
        map.set(month, list)
      }
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, list]) => ({ month, list }))
      .map(({ month, list }) => ({ month, tenants: list }))
  }, [missingByTenant])

  const generatedByTenant = useMemo(() => {
    const map = new Map<string, QuittanceRecord[]>()
    for (const q of quittances) {
      const list = map.get(q.tenantId) ?? []
      list.push(q)
      map.set(q.tenantId, list)
    }
    return tenants
      .map((tenant) => ({
        tenant,
        list: (map.get(tenant.id) ?? []).sort((a, b) =>
          b.periodMonth.localeCompare(a.periodMonth)
        ),
      }))
      .filter(({ list }) => list.length > 0)
  }, [tenants, quittances])

  const generatedByMonth = useMemo(() => {
    const tenantsById = new Map(tenants.map((tenant) => [tenant.id, tenant]))
    const map = new Map<
      string,
      { tenant: Tenant; quittance: QuittanceRecord }[]
    >()
    for (const quittance of quittances) {
      const tenant = tenantsById.get(quittance.tenantId)
      if (!tenant) continue
      const list = map.get(quittance.periodMonth) ?? []
      list.push({ tenant, quittance })
      map.set(quittance.periodMonth, list)
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a > b ? -1 : 1))
      .map(([month, list]) => ({ month, list }))
  }, [tenants, quittances])

  const totalMissing = useMemo(
    () => countMissingQuittances(missingByTenant),
    [missingByTenant]
  )

  const isLoaded = tenantsLoaded && quittancesLoaded

  const noTenants = isLoaded && tenants.length === 0

  const nothingMissing =
    isLoaded &&
    !noTenants &&
    missingByTenant.every(
      ({ missingMonths, hasStartDate }) =>
        hasStartDate && missingMonths.length === 0
    )

  const activeMissingByTenant = missingByTenant.filter(
    ({ missingMonths, hasStartDate }) =>
      !hasStartDate || missingMonths.length > 0
  )

  const missingProfileFields = profileMissingFields(profile)

  if (missingProfileFields.length > 0) {
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
          {missingProfileFields.map((field) => (
            <li
              key={field}
              className="flex items-center gap-2 py-0.5 text-muted-foreground"
            >
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
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="generer">
        <TabsList>
          <TabsTab value="generer">
            À générer
            {isLoaded && totalMissing > 0 ? (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                {totalMissing}
              </span>
            ) : null}
          </TabsTab>
          <TabsTab value="generees">
            Générées
            {isLoaded && quittances.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                {quittances.length}
              </span>
            ) : null}
          </TabsTab>
        </TabsList>

        <TabsPanel value="generer" className="flex flex-col gap-4">
          {/* Toggle vue */}
          {isLoaded && !nothingMissing && !noTenants ? (
            <GroupByToggle groupBy={groupBy} onChange={setGroupBy} />
          ) : null}

          {!isLoaded ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : null}

          {noTenants ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted text-3xl">
                📄
              </div>
              <div className="space-y-1">
                <p className="font-medium">Aucune quittance à générer</p>
                <p className="text-sm text-muted-foreground">
                  Commencez par ajouter un locataire depuis la page Locataires.
                </p>
              </div>
              <Link
                href={`/${profile.id}/locataires`}
                className={cn(buttonVariants({ variant: "default" }))}
              >
                Aller à Locataires
              </Link>
            </div>
          ) : null}

          {nothingMissing ? (
            <p className="text-sm text-muted-foreground">
              Toutes les quittances sont à jour.
            </p>
          ) : null}

          {/* Vue par locataire */}
          {isLoaded && groupBy === "tenant"
            ? activeMissingByTenant.map(
                ({ tenant, missingMonths, hasStartDate }) => (
                  <Accordion
                    key={tenant.id}
                    defaultOpen
                    title={
                      <div className="flex items-center gap-3">
                        <TenantAvatar
                          seed={tenant.avatarSeed}
                          name={tenant.name}
                          size="sm"
                        />
                        <span>
                          {tenant.civility} {tenant.name}
                        </span>
                      </div>
                    }
                    badge={
                      hasStartDate ? (
                        <Badge count={missingMonths.length} />
                      ) : undefined
                    }
                  >
                    {hasStartDate ? (
                      <div className="divide-y divide-border">
                        {missingMonths.map((month) => (
                          <MonthRow
                            key={month}
                            month={month}
                            onGenerate={() => openDialog(tenant, month)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucune date de première quittance renseignée.
                      </p>
                    )}
                  </Accordion>
                )
              )
            : null}

          {/* Vue par mois */}
          {isLoaded && groupBy === "month"
            ? missingByMonth.map(({ month, tenants: monthTenants }) => (
                <Accordion
                  key={month}
                  defaultOpen
                  title={
                    <span className="capitalize">
                      {periodFromMonth(month)?.label ?? month}
                    </span>
                  }
                  badge={<Badge count={monthTenants.length} />}
                >
                  <div className="divide-y divide-border">
                    {monthTenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <TenantAvatar
                            seed={tenant.avatarSeed}
                            name={tenant.name}
                            size="sm"
                          />
                          <span className="text-sm">
                            {tenant.civility} {tenant.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog(tenant, month)}
                        >
                          Générer
                        </Button>
                      </div>
                    ))}
                  </div>
                </Accordion>
              ))
            : null}
        </TabsPanel>

        <TabsPanel value="generees" className="flex flex-col gap-4">
          {isLoaded && generatedByTenant.length > 0 ? (
            <GroupByToggle
              groupBy={generatedGroupBy}
              onChange={setGeneratedGroupBy}
            />
          ) : null}

          {!isLoaded ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : generatedByTenant.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune quittance générée pour l&apos;instant.
            </p>
          ) : generatedGroupBy === "tenant" ? (
            generatedByTenant.map(({ tenant, list }) => (
              <Accordion
                key={tenant.id}
                defaultOpen
                title={
                  <div className="flex items-center gap-3">
                    <TenantAvatar
                      seed={tenant.avatarSeed}
                      name={tenant.name}
                      size="sm"
                    />
                    <span>
                      {tenant.civility} {tenant.name}
                    </span>
                  </div>
                }
                badge={<Badge count={list.length} />}
              >
                <ul className="divide-y divide-border">
                  {list.map((quittance) => (
                    <GeneratedQuittanceRow
                      key={quittance.id}
                      tenant={tenant}
                      quittance={quittance}
                      showTenant={false}
                      viewingId={viewingId}
                      downloadingId={downloadingId}
                      deletingId={deletingId}
                      onView={handleView}
                      onDownload={handleDownload}
                      onDelete={handleDeleteQuittance}
                    />
                  ))}
                </ul>
              </Accordion>
            ))
          ) : (
            generatedByMonth.map(({ month, list }) => (
              <Accordion
                key={month}
                defaultOpen
                title={
                  <span className="capitalize">
                    {periodFromMonth(month)?.label ?? month}
                  </span>
                }
                badge={<Badge count={list.length} />}
              >
                <ul className="divide-y divide-border">
                  {list.map(({ tenant, quittance }) => (
                    <GeneratedQuittanceRow
                      key={quittance.id}
                      tenant={tenant}
                      quittance={quittance}
                      showTenant
                      viewingId={viewingId}
                      downloadingId={downloadingId}
                      deletingId={deletingId}
                      onView={handleView}
                      onDownload={handleDownload}
                      onDelete={handleDeleteQuittance}
                    />
                  ))}
                </ul>
              </Accordion>
            ))
          )}
        </TabsPanel>
      </Tabs>

      <QuittanceDialog
        key={selectedTenant ? `${selectedTenant.id}-${selectedMonth}` : "none"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={profile}
        tenant={selectedTenant}
        initialPeriodMonth={selectedMonth}
        onLogged={refresh}
      />
    </div>
  )
}
