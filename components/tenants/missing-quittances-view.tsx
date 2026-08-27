"use client"

import { useMemo, useState } from "react"

import { Accordion } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { QuittanceDialog } from "@/components/tenants/quittance-dialog"
import { TenantAvatar } from "@/components/tenants/tenant-avatar"
import { useProfileQuittances } from "@/hooks/use-profile-quittances"
import {
  arrivalStartMonth,
  departureEndMonth,
  monthFromDate,
  monthsBetweenInclusive,
  periodFromMonth,
  todayIsoDate,
} from "@/lib/quittance"
import type { Profile } from "@/lib/profiles"
import type { Tenant } from "@/lib/tenants"
import { cn } from "@/lib/utils"

type MissingQuittancesViewProps = {
  profile: Profile
  tenants: Tenant[]
  tenantsLoaded: boolean
}

type TenantMissing = {
  tenant: Tenant
  missingMonths: string[]
  hasStartDate: boolean
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

export function MissingQuittancesView({
  profile,
  tenants,
  tenantsLoaded,
}: MissingQuittancesViewProps) {
  const { quittances, isLoaded: quittancesLoaded, refresh } =
    useProfileQuittances(profile.id)
  const [groupBy, setGroupBy] = useState<GroupBy>("tenant")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>()

  function openDialog(tenant: Tenant, month: string) {
    setSelectedTenant(tenant)
    setSelectedMonth(month)
    setDialogOpen(true)
  }

  const missingByTenant = useMemo<TenantMissing[]>(() => {
    const currentMonth = monthFromDate(todayIsoDate())
    const monthsByTenant = new Map<string, Set<string>>()
    for (const q of quittances) {
      const existing = monthsByTenant.get(q.tenantId) ?? new Set()
      existing.add(q.periodMonth)
      monthsByTenant.set(q.tenantId, existing)
    }

    return tenants.map((tenant) => {
      if (!tenant.firstQuittanceDate) {
        return { tenant, missingMonths: [], hasStartDate: false }
      }
      const startMonth = arrivalStartMonth(tenant.firstQuittanceDate)
      const endMonth = departureEndMonth(tenant.lastQuittanceDate, currentMonth)
      if (startMonth > endMonth) return { tenant, missingMonths: [], hasStartDate: true }
      const expectedMonths = monthsBetweenInclusive(startMonth, endMonth)
      const existingMonths = monthsByTenant.get(tenant.id) ?? new Set()
      const missingMonths = expectedMonths.filter((m) => !existingMonths.has(m))
      return { tenant, missingMonths, hasStartDate: true }
    })
  }, [tenants, quittances])

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

  const isLoaded = tenantsLoaded && quittancesLoaded

  const noTenants = isLoaded && tenants.length === 0

  const nothingMissing =
    isLoaded &&
    !noTenants &&
    missingByTenant.every(
      ({ missingMonths, hasStartDate }) =>
        hasStartDate && missingMonths.length === 0,
    )

  const activeMissingByTenant = missingByTenant.filter(
    ({ missingMonths, hasStartDate }) => !hasStartDate || missingMonths.length > 0,
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle vue */}
      {isLoaded && !nothingMissing && !noTenants ? (
        <div className="flex items-center gap-1 self-start rounded-2xl bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => setGroupBy("tenant")}
            className={cn(
              "rounded-xl px-3 py-1 font-medium text-muted-foreground transition-colors",
              groupBy === "tenant" &&
                "bg-background text-foreground shadow-sm",
            )}
          >
            Par locataire
          </button>
          <button
            type="button"
            onClick={() => setGroupBy("month")}
            className={cn(
              "rounded-xl px-3 py-1 font-medium text-muted-foreground transition-colors",
              groupBy === "month" &&
                "bg-background text-foreground shadow-sm",
            )}
          >
            Par mois
          </button>
        </div>
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
              Commencez par ajouter un locataire dans l&apos;onglet <span className="font-medium text-foreground">Locataires</span>.
            </p>
          </div>
        </div>
      ) : null}

      {nothingMissing ? (
        <p className="text-sm text-muted-foreground">
          Toutes les quittances sont à jour.
        </p>
      ) : null}

      {/* Vue par locataire */}
      {isLoaded && groupBy === "tenant"
        ? activeMissingByTenant.map(({ tenant, missingMonths, hasStartDate }) => (
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
          ))
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

      <QuittanceDialog
        key={
          selectedTenant ? `${selectedTenant.id}-${selectedMonth}` : "none"
        }
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
