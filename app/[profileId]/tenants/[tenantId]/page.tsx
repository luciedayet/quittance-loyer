import { notFound } from "next/navigation"

import { assertCanViewTenant } from "@/lib/auth/ownership"
import { TenantQuittancesView } from "@/components/tenants/tenant-quittances-view"
import { getImpersonation } from "@/lib/auth/impersonation"
import { getSession } from "@/lib/auth/session"
import { getProfileById } from "@/lib/profiles"
import { getBienById } from "@/lib/notion/biens"
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
  const session = await getSession()
  if (!session) notFound()

  // Vérifie que le locataire appartient bien au bailleur de l'URL (et pas
  // seulement que le rôle correspond) pour éviter toute fuite entre bailleurs.
  if (await assertCanViewTenant(session, tenantId)) notFound()

  const profile = await getProfileById(profileId)
  if (!profile) notFound()

  const tenant = await getTenantById(tenantId)
  if (!tenant) notFound()

  const [quittances, bien] = await Promise.all([
    listQuittancesForTenant(tenantId),
    tenant.bienId ? getBienById(tenant.bienId) : Promise.resolve(undefined),
  ])

  const impersonation = await getImpersonation(session.role === "admin")
  const isImpersonatingThisTenant =
    impersonation?.role === "locataire" &&
    impersonation.profileId === profileId &&
    impersonation.tenantId === tenantId

  return (
    <TenantQuittancesView
      profile={profile}
      tenant={tenant}
      bien={bien ?? null}
      initialQuittances={quittances}
      readOnly={session.role === "locataire" || isImpersonatingThisTenant}
    />
  )
}
