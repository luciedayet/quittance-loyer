import { notFound } from "next/navigation"

import { TenantQuittancesView } from "@/components/tenants/tenant-quittances-view"
import { getProfileById } from "@/lib/profiles"
import { getTenantById } from "@/lib/notion/tenants"
import { listQuittancesForTenant } from "@/lib/notion/quittances"

export const dynamic = "force-dynamic"

type TenantQuittancesPageProps = {
  params: Promise<{ profileId: string; tenantId: string }>
}

export default async function TenantQuittancesPage({
  params,
}: TenantQuittancesPageProps) {
  const { profileId, tenantId } = await params
  const profile = await getProfileById(profileId)
  if (!profile) notFound()

  const tenant = await getTenantById(tenantId)
  if (!tenant) notFound()

  const quittances = await listQuittancesForTenant(tenantId)

  return (
    <TenantQuittancesView
      profile={profile}
      tenant={tenant}
      initialQuittances={quittances}
    />
  )
}
