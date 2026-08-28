import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import type { AdminData } from "@/lib/admin-data"
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
}: {
  title: string
  description: string
  actionLabel: string
  actionHref: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Link
          href={actionHref}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {actionLabel}
        </Link>
      </CardContent>
    </Card>
  )
}

export function AdminHomeView({ data }: { data: AdminData }) {
  const {
    users,
    tenants,
    profiles,
    bailleurByProfilePageId,
    profilePageIdBySlug,
  } = data

  const bailleurUsers = users.filter((user) => user.role === "bailleur")
  const activatedBailleurs = bailleurUsers.filter(
    (user) => user.passwordHash
  ).length
  const bailleursWithoutAccount = profiles.filter((profile) => {
    const pageId = profilePageIdBySlug[profile.id]
    return !pageId || !bailleurByProfilePageId[pageId]
  })

  const activatedTenants = tenants.filter((tenant) => tenant.hasAccount).length
  const tenantsWithoutAccess = tenants.filter(
    (tenant) => !tenant.hasAccount && !tenant.verificationCode
  )

  const nothingToDo =
    bailleursWithoutAccount.length === 0 && tenantsWithoutAccess.length === 0

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Bailleurs"
          value={profiles.length}
          href="/admin/bailleurs"
        />
        <StatCard
          label="Comptes bailleur activés"
          value={`${activatedBailleurs}/${bailleurUsers.length}`}
          href="/admin/bailleurs"
        />
        <StatCard
          label="Locataires"
          value={tenants.length}
          href="/admin/locataires"
        />
        <StatCard
          label="Accès locataire activés"
          value={`${activatedTenants}/${tenants.length}`}
          href="/admin/locataires"
        />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-medium">À faire</h2>

        {nothingToDo ? (
          <p className="text-sm text-muted-foreground">
            Tout est à jour, rien à faire pour le moment.
          </p>
        ) : null}

        {bailleursWithoutAccount.length > 0 ? (
          <TaskCard
            title="Inviter des bailleurs"
            description={`${bailleursWithoutAccount.length} bailleur${
              bailleursWithoutAccount.length > 1 ? "s" : ""
            } sans compte : ${bailleursWithoutAccount
              .map((profile) => profile.sciName)
              .join(", ")}.`}
            actionLabel="Gérer les bailleurs"
            actionHref="/admin/bailleurs"
          />
        ) : null}

        {tenantsWithoutAccess.length > 0 ? (
          <TaskCard
            title="Inviter des locataires"
            description={`${tenantsWithoutAccess.length} locataire${
              tenantsWithoutAccess.length > 1 ? "s" : ""
            } sans accès à leur espace.`}
            actionLabel="Gérer les locataires"
            actionHref="/admin/locataires"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-medium">Accès rapide</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/bailleurs"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Gérer les bailleurs
          </Link>
          <Link
            href="/admin/locataires"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Gérer les locataires
          </Link>
        </div>
      </div>
    </div>
  )
}
