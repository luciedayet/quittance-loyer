import { notFound } from "next/navigation"

import { TenantEditView } from "@/components/tenants/tenant-edit-view"
import { assertCanViewTenant } from "@/lib/auth/ownership"
import { getSession } from "@/lib/auth/session"
import { getProfileById } from "@/lib/profiles"
import { getTenantById, listTenants } from "@/lib/notion/tenants"

export const dynamic = "force-dynamic"

type TenantEditPageProps = {
  params: Promise<{ profileId: string; tenantId: string }>
}

export default async function TenantEditPage({ params }: TenantEditPageProps) {
  const { profileId, tenantId } = await params
  const session = await getSession()
  if (!session) notFound()
  if (session.role === "locataire") notFound()
  if (await assertCanViewTenant(session, tenantId)) notFound()

  const [profile, tenant, allTenants] = await Promise.all([
    getProfileById(profileId),
    getTenantById(tenantId),
    listTenants(profileId),
  ])

  if (!profile || !tenant) notFound()

  const availableLocations = [
    ...new Set(
      allTenants.map((t) => t.location).filter((l): l is string => Boolean(l)),
    ),
  ]

  return (
    <TenantEditView
      profile={profile}
      tenant={tenant}
      availableLocations={availableLocations}
    />
  )
}
