"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Edit02Icon } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useState } from "react"

import { AddTenantDialog } from "@/components/tenants/add-tenant-dialog"
import { MissingQuittancesView } from "@/components/tenants/missing-quittances-view"
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
import { useTenants } from "@/hooks/use-tenants"
import {
  formatEuros,
  formatIsoDate,
  monthFromDate,
  todayIsoDate,
} from "@/lib/quittance"
import type { Profile } from "@/lib/profiles"
import { effectiveRateAt, type Tenant } from "@/lib/tenants"
import { cn } from "@/lib/utils"

type TenantsBoardProps = {
  profile: Profile
  /** Masque le lien retour vers la liste des SCI (impersonation admin). */
  hideBackLink?: boolean
}

function TenantSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="size-10 rounded-full bg-muted" />
        <div className="mt-3 h-4 w-32 rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
      </CardHeader>
    </Card>
  )
}

function TenantCard({
  profile,
  tenant,
  currentMonth,
}: {
  profile: Profile
  tenant: Tenant
  currentMonth: string
}) {
  const rate = effectiveRateAt(tenant, currentMonth)
  return (
    <Link
      href={`/${profile.id}/tenants/${tenant.id}`}
      className="group relative block"
    >
      <Card className="relative h-full text-left transition-colors group-hover:bg-muted/40">
        <Link
          href={`/${profile.id}/tenants/${tenant.id}/edit`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "absolute top-4 right-4 bg-secondary",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
          <span className="sr-only">Modifier {tenant.name}</span>
        </Link>
        <CardHeader>
          <TenantAvatar seed={tenant.avatarSeed} name={tenant.name} size="lg" />
          <CardTitle>
            {tenant.civility} {tenant.name}
          </CardTitle>
          <CardDescription>
            {formatEuros(rate.rentAmount + rate.chargesAmount)} €{" "}
            <span className="text-xs">
              (loyer {formatEuros(rate.rentAmount)} + charges{" "}
              {formatEuros(rate.chargesAmount)})
            </span>
          </CardDescription>
          {tenant.location ? (
            <p className="text-xs text-muted-foreground">{tenant.location}</p>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground">
            <p>
              Arrivée :{" "}
              {tenant.firstQuittanceDate
                ? formatIsoDate(tenant.firstQuittanceDate)
                : "—"}
            </p>
            {tenant.lastQuittanceDate ? (
              <p>Départ : {formatIsoDate(tenant.lastQuittanceDate)}</p>
            ) : null}
          </div>
          <p className="mt-auto pt-2 text-sm font-medium text-primary">
            Gérer les quittances →
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function TenantGrid({
  profile,
  tenants,
  currentMonth,
}: {
  profile: Profile
  tenants: Tenant[]
  currentMonth: string
}) {
  const today = todayIsoDate()
  const active = tenants.filter(
    (t) => !t.lastQuittanceDate || t.lastQuittanceDate >= today,
  )
  const inactive = tenants.filter(
    (t) => t.lastQuittanceDate && t.lastQuittanceDate < today,
  )

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Actifs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((tenant) => (
            <TenantCard
              key={tenant.id}
              profile={profile}
              tenant={tenant}
              currentMonth={currentMonth}
            />
          ))}
        </div>
      </section>

      {inactive.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Inactifs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactive.map((tenant) => (
              <TenantCard
                key={tenant.id}
                profile={profile}
                tenant={tenant}
                currentMonth={currentMonth}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function TenantsBoard({
  profile,
  hideBackLink = false,
}: TenantsBoardProps) {
  const { tenants, isLoaded, addTenant } = useTenants(profile.id)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const currentMonth = monthFromDate(todayIsoDate())

  const availableLocations = [
    ...new Set(tenants.map((t) => t.location).filter(Boolean) as string[]),
  ]

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <div className="space-y-2">
        {hideBackLink ? null : (
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            ← Retour aux SCI
          </Link>
        )}
        <h1 className="font-heading text-2xl font-medium">
          {profile.sciName}
        </h1>
      </div>

      <Tabs defaultValue="locataires">
        <TabsList>
          <TabsTab value="locataires">Locataires</TabsTab>
          <TabsTab value="quittances">Quittances</TabsTab>
        </TabsList>

        <TabsPanel value="locataires">
          {!isLoaded ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <TenantSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted text-3xl">
                🏠
              </div>
              <div className="space-y-1">
                <p className="font-medium">Aucun locataire pour l&apos;instant</p>
                <p className="text-sm text-muted-foreground">
                  Ajoutez votre premier locataire pour commencer à générer des quittances.
                </p>
              </div>
              <Button type="button" onClick={() => setAddDialogOpen(true)}>
                + Ajouter un locataire
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setAddDialogOpen(true)}
                >
                  + Ajouter un locataire
                </Button>
              </div>
              <TenantGrid
                profile={profile}
                tenants={tenants}
                currentMonth={currentMonth}
              />
            </>
          )}
        </TabsPanel>

        <TabsPanel value="quittances">
          <MissingQuittancesView
            profile={profile}
            tenants={tenants}
            tenantsLoaded={isLoaded}
          />
        </TabsPanel>
      </Tabs>

      <AddTenantDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        availableLocations={availableLocations}
        onSubmit={addTenant}
      />
    </div>
  )
}
