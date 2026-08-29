"use client"

import { useRouter } from "next/navigation"

import { ImpersonateButton } from "@/components/admin/impersonate-button"
import { TenantInviteRow } from "@/components/tenants/tenant-invite-row"
import type { AdminTenant } from "@/lib/notion/tenants"

type AdminLocatairesViewProps = {
  tenants: AdminTenant[]
  sciByPageId: Record<string, string>
  profileIdByPageId: Record<string, string>
}

export function AdminLocatairesView({
  tenants,
  sciByPageId,
  profileIdByPageId,
}: AdminLocatairesViewProps) {
  const router = useRouter()

  function refresh() {
    router.refresh()
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
              Bailleur
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              Accès locataire
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground"></th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => {
            const sciName = tenant.profilePageId
              ? (sciByPageId[tenant.profilePageId] ?? "–")
              : "–"
            const profileId = tenant.profilePageId
              ? profileIdByPageId[tenant.profilePageId]
              : undefined
            return (
              <tr
                key={tenant.id}
                className="border-b border-border last:border-0 hover:bg-muted/20"
              >
                <td className="px-4 py-3 font-medium">
                  {tenant.civility} {tenant.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{sciName}</td>
                <td className="px-4 py-3">
                  <TenantInviteRow
                    tenantId={tenant.id}
                    currentEmail={tenant.email}
                    verificationCode={tenant.verificationCode}
                    hasAccount={tenant.hasAccount}
                    onUpdated={refresh}
                  />
                </td>
                <td className="px-4 py-3">
                  {profileId ? (
                    <ImpersonateButton
                      payload={{
                        role: "locataire",
                        profileId,
                        tenantId: tenant.id,
                      }}
                    />
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
