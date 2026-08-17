"use client"

import Link from "next/link"
import { useCallback, useState } from "react"

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
import type { QuittanceRecord } from "@/lib/notion/quittances"
import type { Profile } from "@/lib/profiles"
import { formatEuros, formatIsoDate } from "@/lib/quittance"
import type { Tenant } from "@/lib/tenants"
import { cn } from "@/lib/utils"

type TenantQuittancesViewProps = {
  profile: Profile
  tenant: Tenant
  initialQuittances: QuittanceRecord[]
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

  const refreshQuittances = useCallback(async () => {
    const response = await fetch(
      `/api/quittances?tenantId=${encodeURIComponent(tenant.id)}`,
    )
    if (!response.ok) return
    const data = await response.json()
    setQuittances(data.quittances as QuittanceRecord[])
  }, [tenant.id])

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
                  <p className="font-medium">
                    {formatEuros(quittance.totalAmount)} €
                  </p>
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
    </div>
  )
}
