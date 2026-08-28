"use client"

import { TenantsAccessView } from "@/components/tenants/tenants-access-view"
import { useTenantsContext } from "@/components/tenants/tenants-context"

export function AccesPageClient() {
  const { tenants, isLoaded, refresh } = useTenantsContext()
  return (
    <TenantsAccessView
      tenants={tenants}
      tenantsLoaded={isLoaded}
      onUpdated={refresh}
    />
  )
}
