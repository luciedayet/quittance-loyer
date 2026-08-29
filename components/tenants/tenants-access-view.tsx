"use client"

import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { TenantAvatar } from "@/components/tenants/tenant-avatar"
import { TenantInviteRow } from "@/components/tenants/tenant-invite-row"
import type { Tenant } from "@/lib/tenants"
import { cn } from "@/lib/utils"

type TenantsAccessViewProps = {
  profileId: string
  tenants: Tenant[]
  tenantsLoaded: boolean
  onUpdated: () => void
}

export function TenantsAccessView({
  profileId,
  tenants,
  tenantsLoaded,
  onUpdated,
}: TenantsAccessViewProps) {
  if (!tenantsLoaded) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted text-3xl">
          🔑
        </div>
        <div className="space-y-1">
          <p className="font-medium">Aucun locataire pour l&apos;instant</p>
          <p className="text-sm text-muted-foreground">
            Ajoutez un locataire depuis la page Locataires pour gérer ses accès.
          </p>
        </div>
        <Link
          href={`/${profileId}/locataires`}
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Aller à Locataires
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Locataire
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Accès locataire
            </th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr
              key={tenant.id}
              className="border-b border-border last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3 font-medium">
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
              </td>
              <td className="px-4 py-3">
                <TenantInviteRow
                  tenantId={tenant.id}
                  currentEmail={tenant.email}
                  verificationCode={tenant.verificationCode}
                  hasAccount={tenant.hasAccount}
                  onUpdated={onUpdated}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
