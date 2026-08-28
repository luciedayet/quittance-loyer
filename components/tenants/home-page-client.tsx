"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { QuittanceDialog } from "@/components/tenants/quittance-dialog"
import { useBiensContext } from "@/components/tenants/biens-context"
import { useTenantsContext } from "@/components/tenants/tenants-context"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { useProfileQuittances } from "@/hooks/use-profile-quittances"
import { periodFromMonth, todayIsoDate } from "@/lib/quittance"
import {
  computeMissingQuittances,
  countMissingQuittances,
  profileMissingFields,
} from "@/lib/quittances-status"
import type { Profile } from "@/lib/profiles"
import type { Tenant } from "@/lib/tenants"
import { cn } from "@/lib/utils"

function StatCard({
  label,
  value,
  description,
  href,
}: {
  label: string
  value: React.ReactNode
  description?: string
  href: string
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardContent className="flex flex-col gap-1 pt-2">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-3xl">{value}</CardTitle>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  )
}

function TaskCard({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  actionHref?: string
  onAction?: () => void
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actionHref ? (
          <Link
            href={actionHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {actionLabel}
          </Link>
        ) : (
          <Button type="button" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function HomePageClient({ profile }: { profile: Profile }) {
  const { tenants, isLoaded: tenantsLoaded } = useTenantsContext()
  const { biens } = useBiensContext()
  const biensById = useMemo(
    () => new Map(biens.map((bien) => [bien.id, bien])),
    [biens]
  )
  const {
    quittances,
    isLoaded: quittancesLoaded,
    refresh,
  } = useProfileQuittances(profile.id)
  const [dialogState, setDialogState] = useState<{
    tenant: Tenant
    month: string
  } | null>(null)

  const isLoaded = tenantsLoaded && quittancesLoaded
  const missingProfileFields = profileMissingFields(profile)

  const missingByTenant = useMemo(
    () => computeMissingQuittances(tenants, quittances),
    [tenants, quittances]
  )
  const totalMissing = countMissingQuittances(missingByTenant)

  const missingTasks = useMemo(
    () =>
      missingByTenant
        .flatMap(({ tenant, missingMonths }) =>
          missingMonths.map((month) => ({ tenant, month }))
        )
        .sort((a, b) => (a.month < b.month ? -1 : 1)),
    [missingByTenant]
  )

  const today = todayIsoDate()
  const activeCount = tenants.filter(
    (t) => !t.lastQuittanceDate || t.lastQuittanceDate >= today
  ).length

  const tenantsWithoutAccess = tenants.filter(
    (t) => !t.hasAccount && !t.verificationCode
  )
  const activatedCount = tenants.filter((t) => t.hasAccount).length

  const visibleMissingTasks = missingTasks.slice(0, 5)
  const remainingMissingCount = missingTasks.length - visibleMissingTasks.length

  const nothingToDo =
    isLoaded &&
    missingProfileFields.length === 0 &&
    missingTasks.length === 0 &&
    tenantsWithoutAccess.length === 0

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Locataires"
          value={isLoaded ? tenants.length : "—"}
          description={
            isLoaded
              ? `${activeCount} actif${activeCount > 1 ? "s" : ""}`
              : undefined
          }
          href={`/${profile.id}/locataires`}
        />
        <StatCard
          label="Quittances à générer"
          value={isLoaded ? totalMissing : "—"}
          href={`/${profile.id}/quittances`}
        />
        <StatCard
          label="Accès locataire"
          value={isLoaded ? `${activatedCount}/${tenants.length}` : "—"}
          description="Comptes activés"
          href={`/${profile.id}/acces`}
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-medium">À faire</h2>

        {!isLoaded ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : null}

        {nothingToDo ? (
          <p className="text-sm text-muted-foreground">
            Tout est à jour, rien à faire pour le moment.
          </p>
        ) : null}

        {isLoaded && missingProfileFields.length > 0 ? (
          <TaskCard
            title="Compléter le profil de la SCI"
            description={`${missingProfileFields.join(", ")} manquant${
              missingProfileFields.length > 1 ? "s" : ""
            }.`}
            actionLabel="Compléter"
            actionHref={`/${profile.id}/profile`}
          />
        ) : null}

        {isLoaded && missingProfileFields.length === 0
          ? visibleMissingTasks.map(({ tenant, month }) => (
              <TaskCard
                key={`${tenant.id}-${month}`}
                title={`Quittance de ${periodFromMonth(month)?.label ?? month}`}
                description={`${tenant.civility} ${tenant.name}`}
                actionLabel="Générer"
                onAction={() => setDialogState({ tenant, month })}
              />
            ))
          : null}

        {isLoaded && remainingMissingCount > 0 ? (
          <Link
            href={`/${profile.id}/quittances`}
            className="self-start text-sm font-medium text-primary"
          >
            + {remainingMissingCount} autre
            {remainingMissingCount > 1 ? "s" : ""} quittance
            {remainingMissingCount > 1 ? "s" : ""} à générer →
          </Link>
        ) : null}

        {isLoaded && tenantsWithoutAccess.length > 0 ? (
          <TaskCard
            title="Inviter vos locataires"
            description={`${tenantsWithoutAccess.length} locataire${
              tenantsWithoutAccess.length > 1 ? "s" : ""
            } sans accès à leur espace.`}
            actionLabel="Gérer les accès"
            actionHref={`/${profile.id}/acces`}
          />
        ) : null}
      </div>

      <QuittanceDialog
        key={
          dialogState ? `${dialogState.tenant.id}-${dialogState.month}` : "none"
        }
        open={dialogState !== null}
        onOpenChange={(open) => {
          if (!open) setDialogState(null)
        }}
        profile={profile}
        tenant={dialogState?.tenant ?? null}
        bien={
          (dialogState?.tenant.bienId &&
            biensById.get(dialogState.tenant.bienId)) ||
          null
        }
        initialPeriodMonth={dialogState?.month}
        onLogged={refresh}
      />
    </div>
  )
}
