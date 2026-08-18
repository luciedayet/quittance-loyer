"use client"

import { useMemo, useState } from "react"

import { QuittanceDialog } from "@/components/tenants/quittance-dialog"
import { TenantAvatar } from "@/components/tenants/tenant-avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useProfileQuittances } from "@/hooks/use-profile-quittances"
import {
  monthFromDate,
  monthsBetweenInclusive,
  periodFromMonth,
  todayIsoDate,
} from "@/lib/quittance"
import type { Profile } from "@/lib/profiles"
import type { Tenant } from "@/lib/tenants"

type MissingQuittancesViewProps = {
  profile: Profile
  tenants: Tenant[]
  tenantsLoaded: boolean
}

type TenantMissingQuittances = {
  tenant: Tenant
  missingMonths: string[]
  hasStartDate: boolean
}

export function MissingQuittancesView({
  profile,
  tenants,
  tenantsLoaded,
}: MissingQuittancesViewProps) {
  const { quittances, isLoaded: quittancesLoaded, refresh } =
    useProfileQuittances(profile.id)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>()

  const missingByTenant = useMemo<TenantMissingQuittances[]>(() => {
    const currentMonth = monthFromDate(todayIsoDate())
    const monthsByTenant = new Map<string, Set<string>>()
    for (const quittance of quittances) {
      const existing = monthsByTenant.get(quittance.tenantId) ?? new Set()
      existing.add(quittance.periodMonth)
      monthsByTenant.set(quittance.tenantId, existing)
    }

    return tenants.map((tenant) => {
      if (!tenant.firstQuittanceDate) {
        return { tenant, missingMonths: [], hasStartDate: false }
      }
      const startMonth = monthFromDate(tenant.firstQuittanceDate)
      const expectedMonths = monthsBetweenInclusive(startMonth, currentMonth)
      const existingMonths = monthsByTenant.get(tenant.id) ?? new Set()
      const missingMonths = expectedMonths.filter(
        (month) => !existingMonths.has(month),
      )
      return { tenant, missingMonths, hasStartDate: true }
    })
  }, [tenants, quittances])

  function openDialog(tenant: Tenant, month: string) {
    setSelectedTenant(tenant)
    setSelectedMonth(month)
    setDialogOpen(true)
  }

  const isLoaded = tenantsLoaded && quittancesLoaded
  const nothingMissing =
    isLoaded &&
    missingByTenant.every(
      ({ missingMonths, hasStartDate }) =>
        hasStartDate && missingMonths.length === 0,
    )

  return (
    <div className="flex flex-col gap-4">
      {!isLoaded ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : null}

      {nothingMissing ? (
        <p className="text-sm text-muted-foreground">
          Toutes les quittances sont à jour.
        </p>
      ) : null}

      {isLoaded
        ? missingByTenant.map(({ tenant, missingMonths, hasStartDate }) => {
            if (hasStartDate && missingMonths.length === 0) return null

            return (
              <Card key={tenant.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <TenantAvatar seed={tenant.avatarSeed} name={tenant.name} />
                    <div>
                      <CardTitle>
                        {tenant.civility} {tenant.name}
                      </CardTitle>
                      <CardDescription>
                        {hasStartDate
                          ? `${missingMonths.length} quittance${missingMonths.length > 1 ? "s" : ""} à générer.`
                          : "Aucune date de première quittance renseignée."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {hasStartDate ? (
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
                            onClick={() => openDialog(tenant, month)}
                          >
                            Générer
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                ) : null}
              </Card>
            )
          })
        : null}

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
