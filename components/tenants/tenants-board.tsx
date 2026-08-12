"use client"

import Link from "next/link"
import { useState } from "react"

import { AddTenantDialog } from "@/components/tenants/add-tenant-dialog"
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
import { useTenants } from "@/hooks/use-tenants"
import { formatEuros } from "@/lib/quittance"
import type { Profile } from "@/lib/profiles"
import type { Tenant } from "@/lib/tenants"
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

export function TenantsBoard({ profile }: TenantsBoardProps) {
  const { tenants, isLoaded, addTenant } = useTenants(profile.id)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [quittanceDialogOpen, setQuittanceDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  function openQuittanceDialog(tenant: Tenant) {
    setSelectedTenant(tenant)
    setQuittanceDialogOpen(true)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            ← Retour aux SCI
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-medium">
              {profile.sciName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile.property.lines[0]} · {profile.city}
            </p>
          </div>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          Ajouter un locataire
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!isLoaded
          ? Array.from({ length: 3 }).map((_, index) => (
              <TenantSkeleton key={`skeleton-${index}`} />
            ))
          : null}

        {isLoaded
          ? tenants.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                className="text-left"
                onClick={() => openQuittanceDialog(tenant)}
              >
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader>
                    <TenantAvatar
                      seed={tenant.avatarSeed}
                      name={tenant.name}
                      size="lg"
                    />
                    <CardTitle>
                      {tenant.civility} {tenant.name}
                    </CardTitle>
                    <CardDescription>
                      Loyer {formatEuros(tenant.rentAmount)} € · Charges{" "}
                      {formatEuros(tenant.chargesAmount)} €
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Cliquer pour générer une quittance
                    </p>
                  </CardContent>
                </Card>
              </button>
            ))
          : null}

        {isLoaded ? (
          <button
            type="button"
            className="text-left"
            onClick={() => setAddDialogOpen(true)}
          >
            <Card className="flex h-full min-h-44 items-center justify-center border-dashed transition-colors hover:bg-muted/40">
              <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="text-3xl leading-none text-muted-foreground">
                  +
                </span>
                <p className="font-medium">Ajouter un locataire</p>
              </CardContent>
            </Card>
          </button>
        ) : null}
      </div>

      <AddTenantDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={addTenant}
      />

      <QuittanceDialog
        open={quittanceDialogOpen}
        onOpenChange={setQuittanceDialogOpen}
        profile={profile}
        tenant={selectedTenant}
      />
    </div>
  )
}
