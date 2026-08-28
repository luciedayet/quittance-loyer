"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Edit02Icon } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useState } from "react"

import { AddTenantDialog } from "@/components/tenants/add-tenant-dialog"
import { TenantAvatar } from "@/components/tenants/tenant-avatar"
import { useBiensContext } from "@/components/tenants/biens-context"
import { useTenantsContext } from "@/components/tenants/tenants-context"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Bien } from "@/lib/biens"
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
  bien,
}: {
  profile: Profile
  tenant: Tenant
  currentMonth: string
  bien: Bien | undefined
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
            "absolute top-4 right-4 bg-secondary"
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
          {bien ? (
            <p className="text-xs text-muted-foreground">
              {bien.name}
              {tenant.location ? ` · ${tenant.location}` : ""}
            </p>
          ) : tenant.location ? (
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
  biensById,
}: {
  profile: Profile
  tenants: Tenant[]
  currentMonth: string
  biensById: Map<string, Bien>
}) {
  const today = todayIsoDate()
  const active = tenants.filter(
    (t) => !t.lastQuittanceDate || t.lastQuittanceDate >= today
  )
  const inactive = tenants.filter(
    (t) => t.lastQuittanceDate && t.lastQuittanceDate < today
  )

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Actifs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((tenant) => (
            <TenantCard
              key={tenant.id}
              profile={profile}
              tenant={tenant}
              currentMonth={currentMonth}
              bien={tenant.bienId ? biensById.get(tenant.bienId) : undefined}
            />
          ))}
        </div>
      </section>

      {inactive.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Inactifs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactive.map((tenant) => (
              <TenantCard
                key={tenant.id}
                profile={profile}
                tenant={tenant}
                currentMonth={currentMonth}
                bien={tenant.bienId ? biensById.get(tenant.bienId) : undefined}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function TenantsBoard({ profile }: TenantsBoardProps) {
  const { tenants, isLoaded, addTenant } = useTenantsContext()
  const { biens, isLoaded: biensLoaded } = useBiensContext()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const currentMonth = monthFromDate(todayIsoDate())

  const availableLocations = [
    ...new Set(tenants.map((t) => t.location).filter(Boolean) as string[]),
  ]
  const biensById = new Map(biens.map((bien) => [bien.id, bien]))

  const noBiens = biensLoaded && biens.length === 0

  return (
    <div className="flex flex-col gap-4">
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
              {noBiens
                ? "Créez d'abord un bien dans l'onglet Biens pour pouvoir y rattacher un locataire."
                : "Ajoutez votre premier locataire pour commencer à générer des quittances."}
            </p>
          </div>
          {noBiens ? (
            <Link
              href={`/${profile.id}/biens`}
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Aller à Biens
            </Link>
          ) : (
            <Button type="button" onClick={() => setAddDialogOpen(true)}>
              + Ajouter un locataire
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-end">
            <Button
              type="button"
              size="sm"
              disabled={noBiens}
              onClick={() => setAddDialogOpen(true)}
            >
              + Ajouter un locataire
            </Button>
          </div>
          <TenantGrid
            profile={profile}
            tenants={tenants}
            currentMonth={currentMonth}
            biensById={biensById}
          />
        </>
      )}

      <AddTenantDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        availableLocations={availableLocations}
        biens={biens}
        onSubmit={addTenant}
      />
    </div>
  )
}
