"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Edit02Icon } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useState } from "react"

import { AddTenantDialog } from "@/components/tenants/add-tenant-dialog"
import { EditProfileDialog } from "@/components/tenants/edit-profile-dialog"
import { EditTenantDialog } from "@/components/tenants/edit-tenant-dialog"
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
import { formatEuros, formatIsoDate } from "@/lib/quittance"
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

export function TenantsBoard({ profile: initialProfile }: TenantsBoardProps) {
  const [profile, setProfile] = useState(initialProfile)
  const { tenants, isLoaded, addTenant, updateTenant, refresh } = useTenants(
    profile.id,
  )
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false)
  const [editTenantDialogOpen, setEditTenantDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)

  function openEditTenantDialog(tenant: Tenant) {
    setEditingTenant(tenant)
    setEditTenantDialogOpen(true)
  }

  async function handleProfileUpdate(update: {
    sciName: string
    managerName: string
    city: string
    sciAddress: string[]
    propertyShortAddress: string
    propertyLines: string[]
  }) {
    const response = await fetch(`/api/profiles/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error ?? "Erreur lors de la mise à jour de la SCI.")
    }
    setProfile(data as Profile)
  }

  async function handleTenantUpdate(update: {
    civility: Tenant["civility"]
    name: string
    rentAmount: number
    chargesAmount: number
    firstQuittanceDate: string | null
    lastQuittanceDate: string | null
  }) {
    if (!editingTenant) return
    await updateTenant(editingTenant.id, update)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <div className="space-y-2">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← Retour aux SCI
        </Link>
        <div className="flex items-center gap-2">
          <div>
            <h1 className="font-heading text-2xl font-medium">
              {profile.sciName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile.property.lines[0]} · {profile.city}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="bg-secondary"
            onClick={() => setEditProfileDialogOpen(true)}
          >
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            <span className="sr-only">Modifier la SCI</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!isLoaded
          ? Array.from({ length: 3 }).map((_, index) => (
              <TenantSkeleton key={`skeleton-${index}`} />
            ))
          : null}

        {isLoaded
          ? tenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/${profile.id}/tenants/${tenant.id}`}
                className="group relative block"
              >
                <Card className="relative h-full text-left transition-colors group-hover:bg-muted/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-4 right-4 bg-secondary"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      openEditTenantDialog(tenant)
                    }}
                  >
                    <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                    <span className="sr-only">Modifier {tenant.name}</span>
                  </Button>
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
                  <CardContent className="space-y-2">
                    <p className="text-sm font-medium text-primary">
                      Gérer les quittances →
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <p>
                        Première quittance :{" "}
                        {tenant.firstQuittanceDate
                          ? formatIsoDate(tenant.firstQuittanceDate)
                          : "—"}
                      </p>
                      <p>
                        Dernière quittance :{" "}
                        {tenant.lastQuittanceDate
                          ? formatIsoDate(tenant.lastQuittanceDate)
                          : "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
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

      <EditProfileDialog
        open={editProfileDialogOpen}
        onOpenChange={setEditProfileDialogOpen}
        profile={profile}
        onSubmit={handleProfileUpdate}
      />

      <EditTenantDialog
        open={editTenantDialogOpen}
        onOpenChange={setEditTenantDialogOpen}
        tenant={editingTenant}
        onSubmit={handleTenantUpdate}
        onInvited={refresh}
      />
    </div>
  )
}
