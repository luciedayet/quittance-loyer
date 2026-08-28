"use client"

import { MissingQuittancesView } from "@/components/tenants/missing-quittances-view"
import { useTenantsContext } from "@/components/tenants/tenants-context"
import type { Profile } from "@/lib/profiles"

export function QuittancesPageClient({ profile }: { profile: Profile }) {
  const { tenants, isLoaded } = useTenantsContext()
  return (
    <MissingQuittancesView
      profile={profile}
      tenants={tenants}
      tenantsLoaded={isLoaded}
    />
  )
}
