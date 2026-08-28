"use client"

import { TenantsAccessView } from "@/components/tenants/tenants-access-view"
import { useTenantsContext } from "@/components/tenants/tenants-context"

export function AccesPageClient({ profileId }: { profileId: string }) {
  const { tenants, isLoaded, refresh } = useTenantsContext()
  return (
    <TenantsAccessView
      profileId={profileId}
      tenants={tenants}
      tenantsLoaded={isLoaded}
      onUpdated={refresh}
    />
  )
}
